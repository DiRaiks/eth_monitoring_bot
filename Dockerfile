FROM node:16-alpine as building

ARG RPC_PRIVIDER
ARG TELEGRAM_BOT_TOKEN
ENV RPC_PRIVIDER=${RPC_PRIVIDER}
ENV TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}

WORKDIR /app

COPY package.json yarn.lock ./
COPY ./tsconfig*.json ./
COPY ./src ./src

RUN echo "RPC_PRIVIDER: ${RPC_PRIVIDER}" > .env
RUN echo "TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN}" > .env
RUN yarn install --frozen-lockfile --non-interactive && yarn cache clean
RUN yarn build

FROM node:16-alpine

WORKDIR /app

COPY --from=building /app/dist ./dist
COPY --from=building /app/node_modules ./node_modules
COPY ./package.json ./

USER node

CMD ["yarn", "start:prod"]
