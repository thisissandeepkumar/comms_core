
FROM node:18.12.1-alpine3.15
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build
WORKDIR /usr/src/app

RUN npx rimraf node_modules
RUN npm i --omit=dev

RUN npm i -g pm2
RUN mkdir -p /usr/src/app/logs
EXPOSE 3000
CMD [ "pm2-runtime", "ecosystem.config.js" ]