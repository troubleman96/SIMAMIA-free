FROM golang:1.26.9-alpine3.24 AS builder
RUN apk add --no-cache build-base
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=1 go build -trimpath -ldflags='-s -w' -o /out/mishe-api .

FROM alpine:3.24
RUN apk add --no-cache ca-certificates sqlite \
  && addgroup -S mishe \
  && adduser -S -D -H -G mishe mishe \
  && mkdir -p /data \
  && chown mishe:mishe /data
COPY --from=builder /out/mishe-api /usr/local/bin/mishe-api
ENV PORT=8080 MISHE_DB_PATH=/data/mishe.db
USER mishe
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1:8080/api/v1/health || exit 1
ENTRYPOINT ["/usr/local/bin/mishe-api"]
