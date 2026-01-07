# ============================================
# STAGE 1: Dependencies
# ============================================
FROM node:20-alpine AS deps

# Metadatos
LABEL maintainer="TechTrace Team"
LABEL description="Next.js Frontend para TechTrace"

# Instalar libc6-compat para compatibilidad
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Instalar pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml* ./

# Instalar dependencias
RUN pnpm install --frozen-lockfile

# ============================================
# STAGE 2: Builder
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar node_modules desde deps
COPY --from=deps /app/node_modules ./node_modules

# Copiar código fuente
COPY . .

# Variable de entorno para build (se puede sobrescribir en docker-compose)
ARG NEXT_PUBLIC_API_URL=http://localhost/api
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Deshabilitar telemetría de Next.js
ENV NEXT_TELEMETRY_DISABLED=1

# Instalar pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Build de la aplicación
RUN pnpm build

# ============================================
# STAGE 3: Runner
# ============================================
FROM node:20-alpine AS runner

WORKDIR /app

# Variables de entorno
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

# Crear usuario no-root (node ya existe en la imagen)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copiar archivos públicos
COPY --from=builder /app/public ./public

# Copiar archivos compilados
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Cambiar a usuario no-root
USER nextjs

# Exponer puerto
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Comando
CMD ["node", "server.js"]
