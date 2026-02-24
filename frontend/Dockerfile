FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --silent

COPY . .
RUN npm run build

# ── Nginx Serve ───────────────────────────────────────────────────────
FROM nginx:alpine AS runtime

COPY --from=builder /app/build /usr/share/nginx/html

# Custom nginx config for React Router SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
