FROM golang:1.26.9-alpine3.24 AS builder
RUN apk add --no-cache build-base
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=1 go build -trimpath -ldflags='-s -w' -o /out/simamia-api .

FROM alpine:3.24
RUN apk add --no-cache ca-certificates sqlite \
  && addgroup -S simamia \
  && adduser -S -D -H -G simamia simamia \
  && mkdir -p /data \
  && chown simamia:simamia /data
COPY --from=builder /out/simamia-api /usr/local/bin/simamia-api
ENV PORT=8080 SIMAMIA_DB_PATH=/data/simamia.db
USER simamia
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1:8080/api/v1/health || exit 1
ENTRYPOINT ["/usr/local/bin/simamia-api"]
