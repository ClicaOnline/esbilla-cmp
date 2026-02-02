# Dockerfile (raíz del monorepo)
# Multi-stage build: Dashboard + API

# ============================================
# Stage 1: Build del Dashboard
# ============================================
FROM node:20-alpine AS dashboard-builder

WORKDIR /build

# Copiar package.json del dashboard
COPY esbilla-dashboard/package*.json ./
RUN npm ci

# Copiar el restu del dashboard y compilar
COPY esbilla-dashboard/ ./
RUN npm run build

# ============================================
# Stage 2: API de producción
# ============================================
FROM node:20-alpine

WORKDIR /app

# Copiar ficheros de dependencies de la API
COPY esbilla-api/package*.json ./
RUN npm ci --production

# Copiar el códigu de la API
COPY esbilla-api/ ./

# Copiar el dashboard compiláu dende'l stage anterior
COPY --from=dashboard-builder /build/dist ./public/dashboard

# Esposición del puertu
EXPOSE 3000

# Execución del servidor
CMD ["node", "src/index.js"]
