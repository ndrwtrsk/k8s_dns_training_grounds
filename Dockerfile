FROM node:carbon
MAINTAINER Andrew Torski <andrew.torski@gmail.com>

WORKDIR /user/src/app
COPY . .
RUN npm install

EXPOSE 8080 8081 8082
ENTRYPOINT ["node", "city-server.js", "--city"]

