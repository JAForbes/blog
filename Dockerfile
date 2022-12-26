FROM node:16 as build

WORKDIR /app

COPY package.json package-lock.json /app/

RUN npm ci

COPY index.html .
COPY src ./src

COPY assets ./dist/assets
COPY posts ./dist/posts
COPY posts.json ./dist/posts.json

RUN cp -r ./dist/* .
RUN node src/static-build/index.js 

RUN node src/rss/index.js

RUN npx vite build --minify false --sourcemap

FROM nginx as serve
COPY --from=build /app/dist /usr/share/nginx/html
RUN nginx -T

COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
