FROM node:22-alpine

WORKDIR /app

# Install deps (leverages layer caching)
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev && npx prisma generate

COPY . .

ENV NODE_ENV=production
EXPOSE 4000

# Apply migrations, then start.
CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]
