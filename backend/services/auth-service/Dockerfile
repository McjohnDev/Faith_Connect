FROM node:18-slim AS base
WORKDIR /usr/src/app

# Install production dependencies separately to keep runtime image small
FROM node:18-slim AS deps
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install

# Build TypeScript -> JavaScript
FROM node:18-slim AS build
WORKDIR /usr/src/app
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .
RUN npm run build

# Final runtime image
FROM node:18-slim AS runtime
WORKDIR /usr/src/app
ENV NODE_ENV=production
COPY package*.json ./
# Only install production deps for runtime
RUN npm install --omit=dev
COPY --from=build /usr/src/app/dist ./dist

EXPOSE 3001
CMD ["node", "dist/index.js"]

