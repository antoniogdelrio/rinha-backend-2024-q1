FROM node:18.16.0-bullseye
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app/
COPY package-lock.json /usr/src/app/
RUN npm install

COPY . /usr/src/app

EXPOSE 8080

ENTRYPOINT ["npm", "start"]