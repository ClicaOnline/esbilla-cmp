# Dockerfile (raíz del monorepo)
# Multi-stage build: Dashboard + API

# ============================================
# Stage 1: Build del Dashboard
# ============================================
FROM node:20-alpine AS dashboard-builder

WORKDIR /build

# Variables de entorno de Firebase (necesarias en build time)
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID

ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
ENV VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN
ENV VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID
ENV VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET
ENV VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID
ENV VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID

# Copiar package.json del dashboard (npm install porque nun hai lockfile individual)
COPY esbilla-dashboard/package.json ./
RUN npm install

# Copiar el restu del dashboard y compilar
COPY esbilla-dashboard/ ./
RUN npm run build

# ============================================
# Stage 2: API de producción
# ============================================
FROM node:20-alpine

WORKDIR /app

# Copiar ficheros de dependencies de la API
COPY esbilla-api/package.json ./
RUN npm install --omit=dev

# Copiar el códigu de la API
COPY esbilla-api/ ./

# Copiar el dashboard compiláu dende'l stage anterior
COPY --from=dashboard-builder /build/dist ./public/dashboard

# Esposición del puertu
EXPOSE 3000

# Execución del servidor
CMD ["node", "src/index.js"]
