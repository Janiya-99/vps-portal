package docker

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"
	"github.com/go-chi/chi/v5"
)

type DockerService struct {
	cli *client.Client
}

type ContainerItem struct {
	ID               string   `json:"id"`
	Name             string   `json:"name"`
	Image            string   `json:"image"`
	Status           string   `json:"status"`
	State            string   `json:"state"`
	Created          int64    `json:"created"`
	Ports            []string `json:"ports"`
	Networks         []string `json:"networks"`
	IPAddress        string   `json:"ip_address"`
	CPUPercent       float64  `json:"cpu_percent"`
	MemoryUsageBytes uint64   `json:"memory_usage_bytes"`
	MemoryLimitBytes uint64   `json:"memory_limit_bytes"`
}

func NewDockerService() (*DockerService, error) {
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return nil, err
	}
	return &DockerService{cli: cli}, nil
}

func (d *DockerService) ListContainers(ctx context.Context) ([]ContainerItem, error) {
	containers, err := d.cli.ContainerList(ctx, container.ListOptions{All: true})
	if err != nil {
		return nil, err
	}

	result := make([]ContainerItem, 0, len(containers))
	for _, c := range containers {
		name := ""
		if len(c.Names) > 0 {
			name = strings.TrimPrefix(c.Names[0], "/")
		}

		ports := make([]string, 0)
		for _, p := range c.Ports {
			if p.PublicPort > 0 {
				ports = append(ports, fmt.Sprintf("%d:%d/%s", p.PublicPort, p.PrivatePort, p.Type))
			} else if p.PrivatePort > 0 {
				ports = append(ports, fmt.Sprintf("%d/%s", p.PrivatePort, p.Type))
			}
		}

		networks := make([]string, 0)
		ipAddress := ""
		if c.NetworkSettings != nil {
			for netName, netObj := range c.NetworkSettings.Networks {
				networks = append(networks, netName)
				if ipAddress == "" && netObj.IPAddress != "" {
					ipAddress = netObj.IPAddress
				}
			}
		}

		result = append(result, ContainerItem{
			ID:               c.ID[:12],
			Name:             name,
			Image:            c.Image,
			Status:           c.Status,
			State:            c.State,
			Created:          c.Created,
			Ports:            ports,
			Networks:         networks,
			IPAddress:        ipAddress,
			CPUPercent:       0.0,
			MemoryUsageBytes: 0,
			MemoryLimitBytes: 0,
		})
	}

	return result, nil
}

func (d *DockerService) HandleListContainers(w http.ResponseWriter, r *http.Request) {
	items, err := d.ListContainers(r.Context())
	if err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"%s"}`, err.Error()), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(items)
}

func (d *DockerService) HandleContainerAction(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	action := chi.URLParam(r, "action")

	var err error
	timeout := 15

	switch action {
	case "start":
		err = d.cli.ContainerStart(r.Context(), id, container.StartOptions{})
	case "stop":
		err = d.cli.ContainerStop(r.Context(), id, container.StopOptions{Timeout: &timeout})
	case "restart":
		err = d.cli.ContainerRestart(r.Context(), id, container.StopOptions{Timeout: &timeout})
	default:
		http.Error(w, `{"error":"Unsupported action"}`, http.StatusBadRequest)
		return
	}

	if err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"%s"}`, err.Error()), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": fmt.Sprintf("Container %s %s successful", id, action),
	})
}

func (d *DockerService) HandleContainerLogs(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
		return
	}

	options := container.LogsOptions{
		ShowStdout: true,
		ShowStderr: true,
		Follow:     true,
		Tail:       "150",
		Timestamps: true,
	}

	reader, err := d.cli.ContainerLogs(r.Context(), id, options)
	if err != nil {
		fmt.Fprintf(w, "data: Failed to read container logs: %s\n\n", err.Error())
		flusher.Flush()
		return
	}
	defer reader.Close()

	bufReader := bufio.NewReader(reader)
	hdr := make([]byte, 8)

	for {
		select {
		case <-r.Context().Done():
			return
		default:
			_, err := io.ReadFull(bufReader, hdr)
			if err != nil {
				return
			}
			line, err := bufReader.ReadString('\n')
			if err != nil && err != io.EOF {
				return
			}
			cleanLine := strings.TrimRight(line, "\r\n")
			fmt.Fprintf(w, "data: %s\n\n", cleanLine)
			flusher.Flush()
			if err == io.EOF {
				return
			}
		}
	}
}

func (d *DockerService) HandleGetAppEnv(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	envPath := filepath.Join("/opt/apps", slug, ".env.production")

	content, err := os.ReadFile(envPath)
	if err != nil {
		// Fallback to .env
		envPath = filepath.Join("/opt/apps", slug, ".env")
		content, err = os.ReadFile(envPath)
	}

	if err != nil {
		http.Error(w, `{"error":"No environment file found"}`, http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"env": string(content),
	})
}

func (d *DockerService) HandleUpdateAppEnv(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	envPath := filepath.Join("/opt/apps", slug, ".env.production")

	var req struct {
		Env string `json:"env"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"Invalid payload"}`, http.StatusBadRequest)
		return
	}

	if err := os.WriteFile(envPath, []byte(req.Env), 0644); err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"Failed to write env: %s"}`, err.Error()), http.StatusInternalServerError)
		return
	}

	// Trigger compose reload in background
	go func() {
		cmd := exec.Command("docker", "compose", "-f", filepath.Join("/opt/apps", slug, "docker-compose.yml"), "up", "-d")
		_ = cmd.Run()
	}()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Environment saved and container recreation triggered",
	})
}

type ScaffoldRequest struct {
	Slug         string `json:"slug"`
	Framework    string `json:"framework"`
	InternalPort int    `json:"internal_port"`
	WithDatabase bool   `json:"with_database"`
}

func (d *DockerService) HandleScaffoldApp(w http.ResponseWriter, r *http.Request) {
	var req ScaffoldRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"Invalid payload"}`, http.StatusBadRequest)
		return
	}

	if req.Slug == "" {
		http.Error(w, `{"error":"Project slug is required"}`, http.StatusBadRequest)
		return
	}

	appDir := filepath.Join("/opt/apps", req.Slug)
	if err := os.MkdirAll(filepath.Join(appDir, "app"), 0755); err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"Failed to create directories: %s"}`, err.Error()), http.StatusInternalServerError)
		return
	}

	// 1. Dockerfile
	dockerfileContent := getDockerfileForFramework(req.Framework, req.InternalPort)
	_ = os.WriteFile(filepath.Join(appDir, "Dockerfile"), []byte(dockerfileContent), 0644)

	// 2. docker-compose.yml
	composeContent := fmt.Sprintf(`services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: app-%s
    restart: unless-stopped
    env_file: .env.production
    networks:
      - shared-network

networks:
  shared-network:
    external: true
`, req.Slug)
	_ = os.WriteFile(filepath.Join(appDir, "docker-compose.yml"), []byte(composeContent), 0644)

	// 3. .env.production
	envContent := fmt.Sprintf("PORT=%d\nNODE_ENV=production\nAPP_NAME=%s\n", req.InternalPort, req.Slug)
	_ = os.WriteFile(filepath.Join(appDir, ".env.production"), []byte(envContent), 0644)

	// Trigger build and up
	go func() {
		cmd := exec.Command("docker", "compose", "-f", filepath.Join(appDir, "docker-compose.yml"), "up", "-d", "--build")
		_ = cmd.Run()
	}()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Application stack scaffolded successfully",
		"slug":    req.Slug,
	})
}

func getDockerfileForFramework(fw string, port int) string {
	switch fw {
	case "vue-nginx":
		return fmt.Sprintf(`FROM nginx:alpine
COPY app/ /usr/share/nginx/html
EXPOSE %d
CMD ["nginx", "-g", "daemon off;"]
`, port)
	case "go-api":
		return fmt.Sprintf(`FROM golang:1.23-alpine AS builder
WORKDIR /app
COPY app/ .
RUN CGO_ENABLED=0 go build -o /server .

FROM alpine:3.20
COPY --from=builder /server /server
EXPOSE %d
CMD ["/server"]
`, port)
	default: // nextjs
		return fmt.Sprintf(`FROM node:20-alpine
WORKDIR /app
COPY app/package*.json ./
RUN npm install
COPY app/ .
RUN npm run build || true
EXPOSE %d
CMD ["npm", "start"]
`, port)
	}
}

