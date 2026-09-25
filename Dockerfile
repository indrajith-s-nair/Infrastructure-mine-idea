# ==============================================================================
# Stage 1: Build Next.js Frontend
# ==============================================================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install --legacy-peer-deps

COPY frontend/ ./
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# ==============================================================================
# Stage 2: Production Single-Container Runtime (Django + Next.js Standalone)
# ==============================================================================
FROM python:3.12-slim-bookworm AS runner

# Install essential system utilities and Node.js runtime for Next.js standalone
RUN apt-get update && apt-get install -y --no-install-recommends \
  curl \
  gnupg \
  ca-certificates \
  libpq-dev \
  gcc \
  build-essential \
  && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
  && apt-get install -y --no-install-recommends nodejs \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python backend dependencies
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# Copy Backend Source Code
COPY backend/ /app/backend/

# Copy Frontend Standalone Bundle from Stage 1
COPY --from=frontend-builder /app/frontend/.next/standalone /app/frontend/
COPY --from=frontend-builder /app/frontend/.next/static /app/frontend/.next/static
COPY --from=frontend-builder /app/frontend/public /app/frontend/public

# Ensure static & public assets are also mapped to nested frontend folder if created by Next.js standalone
RUN if [ -d "/app/frontend/frontend" ]; then \
  mkdir -p /app/frontend/frontend/.next; \
  cp -r /app/frontend/.next/static /app/frontend/frontend/.next/static 2>/dev/null || true; \
  cp -r /app/frontend/public /app/frontend/frontend/public 2>/dev/null || true; \
  fi

# Copy Entrypoint Execution Script
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Environment Defaults
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV USE_SQLITE="true"
ENV NODE_ENV=production
ENV PORT=3000
ENV INTERNAL_BACKEND_URL=http://127.0.0.1:8000


# Expose Web Portal (3000) and Backend REST API (8000)
EXPOSE 3000 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/api/complaints/stats/ || exit 1

ENTRYPOINT ["/app/entrypoint.sh"]
