FROM node:16 as build

WORKDIR /app

COPY package.json package-lock.json /app/

RUN npm ci

COPY index.html .
COPY src ./src

RUN npx vite build --minify false --sourcemap
RUN ls dist

COPY assets ./dist/assets
COPY posts ./dist/posts
COPY posts.json ./dist/posts.json

FROM node:16 as serve

COPY --from=build /app/dist /srv/http/

WORKDIR /srv/http

CMD ["npx", "serve", "-l", "8043", "--single"]