FROM node:18-slim AS base
WORKDIR /usr/src/app

# Install all dependencies for build
FROM node:18-slim AS deps
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install

# Build TypeScript
FROM node:18-slim AS build
WORKDIR /usr/src/app
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .
RUN npm run build

# Runtime image with production deps only
FROM node:18-slim AS runtime
WORKDIR /usr/src/app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=build /usr/src/app/dist ./dist

EXPOSE 3002
CMD ["node", "dist/index.js"]

