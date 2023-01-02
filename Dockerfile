FROM node:16 as build

WORKDIR /app

COPY package.json package-lock.json /app/

RUN npm ci

COPY index.html .
COPY src ./src

COPY assets ./public/assets
COPY posts ./posts

COPY posts.json posts.json
RUN cp posts.json ./public/posts.json
RUN cp -r posts ./public/posts

RUN node src/rss/index.js

RUN npx vite build --minify false --sourcemap

RUN node src/static-build/index.js

FROM nginx as serve
COPY --from=build /app/public /usr/share/nginx/html
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
RUN nginx -T
EXPOSE 80
