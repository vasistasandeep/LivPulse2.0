# LivPulse v2.0 Backend Dockerfile for Railway Deployment
# This builds and runs the Node.js backend from the monorepo structure

FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy backend package files first for better caching
COPY backend/package*.json ./backend/

# Install backend dependencies
WORKDIR /app/backend
RUN npm ci --production=false

# Copy backend source code
COPY backend/ ./

# Build the TypeScript application
RUN npm run build

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S livpulse -u 1001

# Change ownership of the app directory
RUN chown -R livpulse:nodejs /app
USER livpulse

# Expose port
EXPOSE 10000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js || exit 1

# Start the application
CMD ["npm", "start"]