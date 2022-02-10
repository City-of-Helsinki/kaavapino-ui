FROM node:14.16.1-alpine3.13

WORKDIR /kaavapino-ui

ENV APP_NAME kaavapino-ui

COPY package.json yarn.lock ./
RUN yarn install && yarn cache clean --force

COPY . .

CMD ["yarn", "start"]
