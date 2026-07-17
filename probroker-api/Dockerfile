FROM node:20-slim AS base
WORKDIR /app

# sharp needs these for image processing at runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    libvips-dev \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --omit=dev

COPY src ./src

ENV NODE_ENV=production
EXPOSE 8000

CMD ["node", "src/server.js"]
