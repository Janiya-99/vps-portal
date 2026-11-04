package auth

import (
	"context"
	"encoding/json"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type Claims struct {
	Username string `json:"username"`
	jwt.RegisteredClaims
}

type AuthHandler struct {
	jwtSecret     []byte
	adminUser     string
	adminPassHash string
}

func NewAuthHandler() *AuthHandler {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "vps-nexus-jwt-secret-key-change-in-production-172.255.210.203"
	}

	user := os.Getenv("ADMIN_USERNAME")
	if user == "" {
		user = "admin"
	}

	passHash := os.Getenv("ADMIN_PASSWORD_HASH")
	if passHash == "" {
		// Default password: adminpassword (or VPS root password)
		defaultPass := os.Getenv("ADMIN_PASSWORD")
		if defaultPass == "" {
			defaultPass = "adminpassword"
		}
		hash, err := bcrypt.GenerateFromPassword([]byte(defaultPass), bcrypt.DefaultCost)
		if err == nil {
			passHash = string(hash)
		}
	}

	return &AuthHandler{
		jwtSecret:     []byte(secret),
		adminUser:     user,
		adminPassHash: passHash,
	}
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func (a *AuthHandler) HandleLogin(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"Invalid request payload"}`, http.StatusBadRequest)
		return
	}

	if req.Username != a.adminUser {
		http.Error(w, `{"error":"Invalid username or password"}`, http.StatusUnauthorized)
		return
	}

	// Compare bcrypt hash
	if err := bcrypt.CompareHashAndPassword([]byte(a.adminPassHash), []byte(req.Password)); err != nil {
		http.Error(w, `{"error":"Invalid username or password"}`, http.StatusUnauthorized)
		return
	}

	// Create JWT Token
	expirationTime := time.Now().Add(72 * time.Hour)
	claims := &Claims{
		Username: req.Username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "vps-nexus",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(a.jwtSecret)
	if err != nil {
		http.Error(w, `{"error":"Failed to generate session token"}`, http.StatusInternalServerError)
		return
	}

	// Set HttpOnly SameSite=Strict cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "vps_nexus_token",
		Value:    tokenString,
		Expires:  expirationTime,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteStrictMode,
		Secure:   false, // set to true when on HTTPS behind reverse proxy
	})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":  "Authenticated successfully",
		"username": req.Username,
	})
}

func (a *AuthHandler) HandleLogout(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{
		Name:     "vps_nexus_token",
		Value:    "",
		Expires:  time.Now().Add(-1 * time.Hour),
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteStrictMode,
	})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Logged out successfully",
	})
}

func (a *AuthHandler) HandleMe(w http.ResponseWriter, r *http.Request) {
	username, ok := r.Context().Value("username").(string)
	if !ok || username == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"authenticated": false,
		})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"authenticated": true,
		"username":      username,
	})
}

func (a *AuthHandler) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Allow login endpoint
		if r.URL.Path == "/api/v1/auth/login" || r.URL.Path == "/api/v1/auth/me" {
			// Extract token if present for Me
			cookie, err := r.Cookie("vps_nexus_token")
			if err == nil && cookie.Value != "" {
				claims := &Claims{}
				tkn, err := jwt.ParseWithClaims(cookie.Value, claims, func(token *jwt.Token) (interface{}, error) {
					return a.jwtSecret, nil
				})
				if err == nil && tkn.Valid {
					ctx := context.WithValue(r.Context(), "username", claims.Username)
					r = r.WithContext(ctx)
				}
			}
			next.ServeHTTP(w, r)
			return
		}

		// Check Cookie or Authorization header
		var tokenStr string
		cookie, err := r.Cookie("vps_nexus_token")
		if err == nil {
			tokenStr = cookie.Value
		} else {
			authHeader := r.Header.Get("Authorization")
			if strings.HasPrefix(authHeader, "Bearer ") {
				tokenStr = strings.TrimPrefix(authHeader, "Bearer ")
			}
		}

		if tokenStr == "" {
			http.Error(w, `{"error":"Authentication required"}`, http.StatusUnauthorized)
			return
		}

		claims := &Claims{}
		tkn, err := jwt.ParseWithClaims(tokenStr, claims, func(token *jwt.Token) (interface{}, error) {
			return a.jwtSecret, nil
		})

		if err != nil || !tkn.Valid {
			http.Error(w, `{"error":"Invalid or expired session token"}`, http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), "username", claims.Username)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

