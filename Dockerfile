# Stage 1: Build React + TypeScript Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /build/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Go Backend Binary with Embedded Frontend
FROM golang:alpine AS backend-builder
WORKDIR /build/backend
RUN apk add --no-cache git
COPY backend/go.mod ./
COPY backend/ ./
COPY --from=frontend-builder /build/frontend/dist ./dist
RUN go mod tidy
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /vps-portal main.go

# Stage 3: Minimal Production Runtime with Docker CLI & Compose Plugin
FROM alpine:3.20
RUN apk add --no-cache ca-certificates tzdata docker-cli docker-cli-compose bash curl
WORKDIR /app
COPY --from=backend-builder /vps-portal /app/vps-portal
EXPOSE 8080
CMD ["/app/vps-portal"]
