FROM node:22-alpine AS builder
WORKDIR /site
COPY landing/ ./
RUN node build.mjs

FROM nginx:1.30.5-alpine3.24
COPY landing/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /site/dist/ /usr/share/nginx/html/
EXPOSE 80
