FROM node:lts-alpine

ENV NODE_ENV=production

WORKDIR /app

COPY . /app

RUN npm install -g -s --no-progress yarn && \
  yarn && \
  yarn run build && \
  yarn cache clean

EXPOSE 3001

CMD ["npm", "run","start"]