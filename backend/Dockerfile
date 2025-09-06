# Use Node.js 18 Alpine from a registry with better rate limits
# Alternative registries: mcr.microsoft.com, ghcr.io, quay.io
FROM node:18-alpine

# Install dumb-init for proper signal handling in production
RUN apk add --no-cache dumb-init

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S revedkids -u 1001 -G nodejs

# Copy package files first for better Docker layer caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy source code
COPY --chown=revedkids:nodejs . .

# Build the TypeScript application
RUN npm run build

# Switch to non-root user
USER revedkids

# Expose the application port
EXPOSE 3003

# Add comprehensive health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3003/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
# Start the application
CMD ["node", "dist/server.js"]