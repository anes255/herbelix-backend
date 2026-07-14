# Debian (bookworm) base — has OpenSSL 3.0, which Prisma detects reliably.
# This fixes the Render "Could not parse schema engine response" / libssl error
# that happens on the native runtime where OpenSSL detection fails.
FROM node:20-slim

# Prisma needs the openssl package present so it picks the right engine.
RUN apt-get update -y && apt-get install -y openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install deps + generate the Prisma client (leverages layer caching)
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev && npx prisma generate

COPY . .

ENV NODE_ENV=production
EXPOSE 4000

# Apply any pending migrations (no-op if DB already migrated), then start.
CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]
