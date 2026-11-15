FROM node:24-bookworm-slim AS build
WORKDIR /build
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund
COPY . .
RUN npm run build
FROM nginx:stable-bookworm
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /build/dist/instalert/browser /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=6 CMD curl -fsS http://127.0.0.1/healthz || exit 1
