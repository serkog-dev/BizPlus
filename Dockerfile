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

# Build API using tsc directly — verify output or fail with diagnostics
RUN cd apps/api && npx tsc -p tsconfig.build.json \
    && echo "=== TSC COMPLETED ===" \
    && (test -f dist/src/main.js && echo "FOUND dist/src/main.js") \
    || (echo "!!! dist/src/main.js NOT FOUND !!!" \
        && echo "--- Listing dist/ ---" \
        && find dist/ -type f 2>/dev/null | head -30 \
        && echo "--- Listing current dir ---" \
        && ls -la \
        && echo "--- rootDir check ---" \
        && cat tsconfig.build.json \
        && exit 1)

# Set working directory to apps/api
WORKDIR /app/apps/api

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]
