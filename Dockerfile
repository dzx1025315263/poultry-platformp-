FROM node:22-slim AS base

# Install pnpm
RUN npm install -g pnpm@10.4.1

WORKDIR /app

# Copy package files first for better caching of dependencies
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/

# Install dependencies (this layer can be cached)
RUN pnpm install --frozen-lockfile

# Copy all source files
COPY . .

# Use a build arg that changes every deploy to bust cache for the build step
ARG CACHEBUST=1
RUN echo "Cache bust: $CACHEBUST"

# Build the application (this will NOT be cached due to CACHEBUST)
RUN pnpm run build

# Expose port
EXPOSE 8080

# Set environment
ENV NODE_ENV=production
ENV PORT=8080

# Start the server
CMD ["node", "dist/index.js"]
