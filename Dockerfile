FROM node:16 as build

WORKDIR /app

COPY package.json package-lock.json /app/

RUN npm ci

COPY index.html .
COPY ./src ./src

COPY ./public ./public

RUN node src/rss/index.js
RUN node src/static-build/index.js
RUN npx vite build --minify false --sourcemap
RUN wget https://cohost.org/jmsfbs-code/rss/public.json -O ./public/feed/cohost.json

FROM caddy:2.6.2-alpine as serve
COPY --from=build /app/public /usr/share/caddy
COPY --from=build /app/dist /usr/share/caddy
COPY ./Caddyfile /etc/caddy/Caddyfile
EXPOSE 80
