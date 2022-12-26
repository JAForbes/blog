FROM node:16 as build

WORKDIR /app

COPY package.json package-lock.json /app/

RUN npm ci

COPY index.html .
COPY src ./src

COPY assets ./public/assets
COPY posts ./dist/posts
COPY posts ./posts
COPY posts.json ./dist/posts.json

COPY posts.json posts.json

RUN npx vite build --minify false --sourcemap

RUN node src/rss/index.js
RUN node src/static-build/index.js 

FROM nginx as serve
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
RUN nginx -T
EXPOSE 80
