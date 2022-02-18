FROM node:14.16.1-alpine3.13 AS builder

ARG REACT_APP_BASE_URL
ARG REACT_APP_OPENID_AUDIENCE
ARG REACT_APP_OPENID_CONNECT_CLIENT_ID
ARG REACT_APP_SENTRY_URL

WORKDIR /app

ENV APP_NAME kaavapino-ui

COPY package.json yarn.lock ./
RUN yarn install && yarn cache clean --force

COPY . .

RUN echo -e "BUILD ENVIRONMENT\n" && \
    env && \
    echo -e "\nSTARTING BUILD\n" && \
    yarn build

####

FROM registry.access.redhat.com/ubi8/nginx-120

COPY nginx/default.conf "${NGINX_DEFAULT_CONF_PATH}"
COPY nginx/logging.conf /opt/app-root/etc/nginx.default.d/
COPY --from=builder --chown=1001:0 /app/build .

EXPOSE 9000
CMD nginx -g "daemon off;"
