FROM node:18-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9

# Copy workspace config and lockfile
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy all source code
COPY . .

# Build shared package (API depends on it)
RUN pnpm --filter @bizplus/shared run build

# Generate Prisma client
RUN cd apps/api && npx prisma generate

# Build NestJS API and verify output exists
RUN pnpm --filter api run build \
    && echo "=== BUILD OUTPUT ===" \
    && ls -la /app/apps/api/dist/src/main.js \
    && echo "=== BUILD OK ==="

# Verify dist survives to final layer
RUN ls -la /app/apps/api/dist/src/main.js && echo "DIST VERIFIED"

# KEY FIX: Set working directory to apps/api
# so "node dist/src/main.js" resolves to /app/apps/api/dist/src/main.js
WORKDIR /app/apps/api

EXPOSE 3000

CMD ["sh", "-c", "echo 'Checking files...' && ls -la dist/src/main.js && npx prisma migrate deploy && node dist/src/main.js"]
