FROM node:lts-alpine AS builder

WORKDIR /app

COPY . .

RUN yarn
RUN yarn build

CMD ["yarn","start"]
