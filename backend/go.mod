module vps-portal/backend

go 1.23

require (
	github.com/docker/docker v27.3.1+incompatible
	github.com/go-chi/chi/v5 v5.1.0
	github.com/go-chi/cors v1.2.1
	github.com/go-sql-driver/mysql v1.8.1
	github.com/golang-jwt/jwt/v5 v5.2.1
	github.com/redis/go-redis/v9 v9.7.0
	github.com/shirou/gopsutil/v4 v4.24.10
	golang.org/x/crypto v0.29.0
)

replace github.com/docker/go-connections => github.com/docker/go-connections v0.5.0
