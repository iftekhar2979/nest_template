# --- Base image ---
FROM node:20-alpine AS base
RUN npm install -g pnpm

# --- Dependencies stage ---
FROM base AS dependencies
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# --- Build stage ---
FROM base AS build
WORKDIR /app
COPY . .
# Copy node_modules from dependencies stage to speed up build
COPY --from=dependencies /app/node_modules ./node_modules
RUN pnpm build
# Prune node_modules to production only
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

# --- Final production stage ---
FROM node:20-alpine AS production
WORKDIR /app

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Copy only necessary files from the build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/src/views ./src/views
COPY --from=build /app/public ./public

# Expose port 8080
EXPOSE 8080

# Define entrypoint
CMD ["node", "dist/main"]
