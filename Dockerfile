FROM node:20-alpine AS build
WORKDIR /usr/src/app/
COPY package-lock.json package.json ./
RUN npm ci

COPY src ./src
COPY public ./public 
COPY astro.config.mjs ./
RUN npm run build
RUN apk add tree
RUN pwd
RUN ls -1l .
RUN ls -1l /usr/src/app/dist
RUN tree . -I node_modules

FROM caddy:2.6.4-alpine AS serve

COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /usr/src/app/dist /srv