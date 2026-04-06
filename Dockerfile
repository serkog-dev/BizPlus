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

# Build NestJS API
RUN pnpm --filter api run build

# KEY FIX: Set working directory to apps/api
# so "node dist/src/main.js" resolves to /app/apps/api/dist/src/main.js
WORKDIR /app/apps/api

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]
