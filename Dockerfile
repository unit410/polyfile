FROM node:14-alpine as base
FROM base as builder

ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

ADD package.json /app/
ADD yarn.lock /app/

RUN yarn install

ADD . /app
RUN yarn build

# install only production packages
RUN rm -rf /app/node_modules
RUN yarn install --production

# second stage - only production packages - copy over dist folder
FROM base

ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

COPY --from=builder /app/.next /app/.next
COPY --from=builder /app/public /app/public
COPY --from=builder /app/package.json /app/
COPY --from=builder /app/node_modules /app/node_modules

# uncomment if next.config.js is present
# COPY --from=builder /app/next.config.js /app/

CMD ["yarn", "start", "--port", "8080"]
