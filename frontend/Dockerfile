FROM node:20-slim AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

# static output is copied by Caddy via shared volume / multi-stage
FROM caddy:2-alpine
COPY --from=build /app/dist /srv
