# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Inject API URL at build time via --build-arg
ARG VITE_API_URL
ARG VITE_MASTER_KEY
RUN echo "VITE_API_URL=${VITE_API_URL}" > .env && \
    echo "VITE_MASTER_KEY=${VITE_MASTER_KEY}" >> .env && \
    npm run build

# ── Stage 2: Serve ────────────────────────────────────────────────────────────
FROM nginx:alpine

# SPA routing — all paths fall back to index.html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
