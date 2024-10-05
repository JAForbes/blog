FROM node:20-alpine AS build
WORKDIR /usr/src/app/
COPY package-lock.json package.json ./
RUN npm ci

COPY src ./src
COPY public ./public 
COPY astro.config.mjs ./
RUN npm run build

FROM caddy:2.6.4-alpine AS serve

COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /usr/src/app/dist /srv