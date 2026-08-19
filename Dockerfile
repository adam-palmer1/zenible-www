# ---- build ----
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite inlines VITE_* at BUILD time, so the runtime env_file no longer reaches
# the app. .env.docker stays the single source of truth; Vite auto-loads
# .env.production for `vite build` (mode=production).
RUN cp .env.docker .env.production

# Widget first: it emits into public/call-widget, which the main build then
# copies into dist. Reversing the order ships a stale widget.
RUN npm run build:call-widget && npm run build

# ---- serve ----
FROM nginx:1.27-alpine AS serve

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8021

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -qO- http://127.0.0.1:8021/healthz || exit 1
