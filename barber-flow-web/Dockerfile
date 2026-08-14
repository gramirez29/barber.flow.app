# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Vite inlines VITE_* vars into the bundle at build time, but Docker builds don't inherit
# the platform's runtime env vars automatically - each one needs an explicit ARG (Railway
# auto-populates any ARG whose name matches a configured service variable) turned into an
# ENV so `npm run build` (and Vite's `import.meta.env`) can actually see it.
ARG VITE_API_BASE_URL
ARG VITE_API_TIMEOUT
ARG VITE_APP_ENV
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_API_TIMEOUT=$VITE_API_TIMEOUT
ENV VITE_APP_ENV=$VITE_APP_ENV

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install serve to run the app
RUN npm install -g serve

# Copy built app from builder
COPY --from=builder /app/dist ./dist

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Start the application. Binding host must be explicit: "-l 3000" alone lets `serve`
# pick its own default bind address, which isn't reachable from outside the container
# on some hosts (e.g. Railway's private network proxy gets "connection refused").
CMD ["serve", "-s", "dist", "-l", "tcp://0.0.0.0:3000"]
