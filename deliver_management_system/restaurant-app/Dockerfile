# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL
ARG VITE_MASTER_KEY
ARG VITE_COGNITO_RESTAURANT_CLIENT_ID
ARG VITE_AWS_REGION
RUN echo "VITE_API_URL=${VITE_API_URL}" > .env && \
    echo "VITE_MASTER_KEY=${VITE_MASTER_KEY}" >> .env && \
    echo "VITE_COGNITO_RESTAURANT_CLIENT_ID=${VITE_COGNITO_RESTAURANT_CLIENT_ID}" >> .env && \
    echo "VITE_AWS_REGION=${VITE_AWS_REGION}" >> .env && \
    npm run build

# ── Stage 2: Serve ────────────────────────────────────────────────────────────
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
