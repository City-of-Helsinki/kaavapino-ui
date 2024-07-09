FROM registry.access.redhat.com/ubi8/nodejs-18 AS builder

ARG REACT_APP_BASE_URL
ARG REACT_APP_OPENID_AUDIENCE
ARG REACT_APP_OPENID_CONNECT_CLIENT_ID
ARG REACT_APP_SENTRY_URL

ENV YARN_VERSION 3.4.1
RUN env
WORKDIR /app

ENV APP_NAME kaavapino-ui

COPY package.json ./

COPY --chown=1001 .yarn/ ./.yarn/
COPY --chown=1001 .yarnrc.yml yarn.lock ./

RUN npm install -g yarn
#Ignore scripts is removed from modern yarn and is moved to .yarnrc settings as enableScripts: false
RUN yarn install && yarn cache clean

COPY --chown=1001 . .

RUN echo -e "BUILD ENVIRONMENT\n" && \
    env && \
    echo -e "\nSTARTING BUILD\n" && \
    yarn build

####

FROM registry.access.redhat.com/ubi9/nginx-120

COPY nginx/default.conf "${NGINX_DEFAULT_CONF_PATH}"
COPY nginx/logging.conf /opt/app-root/etc/nginx.default.d/
COPY --from=builder --chown=1001:0 /app/build .

EXPOSE 9000
CMD nginx -g "daemon off;"