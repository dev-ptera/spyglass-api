FROM node:lts-alpine AS builder

WORKDIR /

COPY . .

RUN yarn
RUN yarn build

CMD ["yarn","start"]
