# Stage 1: Build frontend
FROM node:20-alpine AS frontend
WORKDIR /app
COPY web/package.json web/tsconfig.json web/vite.config.ts ./
COPY web/public ./public
COPY web/src ./src
COPY web/index.html ./
RUN npm install && npm run build

# Stage 2: Build Go server
FROM golang:1.22-alpine AS builder
ENV GOFLAGS=-mod=mod
ENV GONOSUMCHECK=*
ENV GOPROXY=https://goproxy.cn,https://goproxy.io,direct
WORKDIR /app
COPY server/ .
RUN go mod download
RUN go build -o server .

# Final stage
FROM alpine
RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=builder /app/server .
COPY --from=frontend /app/dist ./dist
EXPOSE 8080
CMD ["./server"]