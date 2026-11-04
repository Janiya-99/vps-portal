package main

import (
	"embed"
	"encoding/json"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"vps-portal/backend/internal/auth"
	"vps-portal/backend/internal/database"
	"vps-portal/backend/internal/docker"
	"vps-portal/backend/internal/ops"
	"vps-portal/backend/internal/proxy"
	"vps-portal/backend/internal/telemetry"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

//go:embed all:dist
var frontendFS embed.FS

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	r := chi.NewRouter()

	// Global Middlewares
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Initialize Services
	authHandler := auth.NewAuthHandler()
	dbService := database.NewDatabaseService()
	opsService := ops.NewOpsService()
	proxyService := proxy.NewProxyService()

	dockerService, err := docker.NewDockerService()
	if err != nil {
		log.Printf("[WARN] Docker client init warning: %v", err)
	}

	// API Routes Group
	r.Route("/api/v1", func(apiRoute chi.Router) {
		// Public Auth Endpoints
		apiRoute.Post("/auth/login", authHandler.HandleLogin)
		apiRoute.Post("/auth/logout", authHandler.HandleLogout)
		apiRoute.Get("/auth/me", authHandler.HandleMe)
		apiRoute.Get("/ping", func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(fmt.Sprintf(`{"status":"pong","t":%d}`, time.Now().UnixMilli())))
		})
		apiRoute.Get("/meta", func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"ip":             "172.255.210.203",
				"domain":         "vps.pixandco.lk",
				"phpmyadmin_url": "http://172.255.210.203:8085",
				"location": map[string]interface{}{
					"city":        "Singapore",
					"country":     "Singapore",
					"flag":        "🇸🇬",
					"datacenter":  "Leaseweb Asia Pacific (AS59253)",
					"isp":         "Leaseweb Singapore Pte. Ltd.",
					"timezone":    "Asia/Singapore",
					"latitude":    1.27998,
					"longitude":   103.842,
				},
				"timestamp": time.Now().UnixMilli(),
			})
		})

		// Protected Sub-routes
		apiRoute.Group(func(protected chi.Router) {
			protected.Use(authHandler.Middleware)

			// 1. Telemetry SSE Stream
			protected.Get("/telemetry/stream", func(w http.ResponseWriter, r *http.Request) {
				w.Header().Set("Content-Type", "text/event-stream")
				w.Header().Set("Cache-Control", "no-cache")
				w.Header().Set("Connection", "keep-alive")

				flusher, ok := w.(http.Flusher)
				if !ok {
					http.Error(w, "SSE not supported", http.StatusInternalServerError)
					return
				}

				ticker := time.NewTicker(2 * time.Second)
				defer ticker.Stop()

				// Immediate initial push
				if data, err := telemetry.CollectTelemetry(); err == nil {
					b, _ := json.Marshal(data)
					fmt.Fprintf(w, "data: %s\n\n", string(b))
					flusher.Flush()
				}

				for {
					select {
					case <-r.Context().Done():
						return
					case <-ticker.C:
						data, err := telemetry.CollectTelemetry()
						if err != nil {
							continue
						}
						b, _ := json.Marshal(data)
						fmt.Fprintf(w, "data: %s\n\n", string(b))
						flusher.Flush()
					}
				}
			})

			// 2. Containers & Docker
			if dockerService != nil {
				protected.Get("/containers", dockerService.HandleListContainers)
				protected.Post("/containers/{id}/{action}", dockerService.HandleContainerAction)
				protected.Get("/containers/{id}/logs", dockerService.HandleContainerLogs)
				protected.Get("/apps/{slug}/env", dockerService.HandleGetAppEnv)
				protected.Put("/apps/{slug}/env", dockerService.HandleUpdateAppEnv)
				protected.Post("/apps/scaffold", dockerService.HandleScaffoldApp)
			}

			// 3. Database & Redis
			protected.Get("/databases", dbService.HandleListDatabases)
			protected.Post("/databases", dbService.HandleProvisionDatabase)
			protected.Post("/databases/{name}/dump", dbService.HandleDumpDatabase)
			protected.Get("/redis/stats", dbService.HandleRedisStats)
			protected.Post("/redis/flush", dbService.HandleFlushRedis)

			// 4. Domains & Proxy
			protected.Get("/proxy/hosts", proxyService.HandleListProxyHosts)
			protected.Post("/proxy/hosts", proxyService.HandleCreateProxyHost)

			// 5. Backups & Ops
			protected.Get("/ops/backups", opsService.HandleListBackups)
			protected.Post("/ops/backups/run", opsService.HandleRunBackup)
			protected.Get("/ops/backups/download/{filename}", opsService.HandleDownloadBackup)
			protected.Post("/ops/prune", opsService.HandleDockerPrune)
		})
	})

	// Static Assets & SPA Fallback
	distFS, err := fs.Sub(frontendFS, "dist")
	if err == nil {
		fileServer := http.FileServer(http.FS(distFS))
		spaHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			path := strings.TrimPrefix(r.URL.Path, "/")
			if path != "" {
				if _, err := distFS.Open(path); err == nil {
					fileServer.ServeHTTP(w, r)
					return
				}
			}
			// Fallback to index.html for SPA routing
			indexData, err := fs.ReadFile(distFS, "index.html")
			if err != nil {
				http.NotFound(w, r)
				return
			}
			w.Header().Set("Content-Type", "text/html; charset=utf-8")
			w.Write(indexData)
		})
		r.Get("/*", spaHandler)
		r.Head("/*", spaHandler)
	} else {
		log.Printf("[INFO] Embedded dist not available, API-only mode active on port %s", port)
	}

	log.Printf("==================================================")
	log.Printf("  VPS Nexus Control Portal Server")
	log.Printf("  Host: 172.255.210.203 | Listening on :%s", port)
	log.Printf("==================================================")

	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}

