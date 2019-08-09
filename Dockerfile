FROM node:10-alpine
LABEL maintainer="LeanKit DevOps Security"

RUN apk update && \
    apk add jq bash curl python make && \
    rm -rf /var/cache/apk/* /tmp/*

USER node
WORKDIR /home/node
COPY ./.docker/usr/local/bin /usr/local/bin
COPY . .
RUN npm install
ENTRYPOINT ["/usr/local/bin/entry.sh"]
CMD ["/usr/local/bin/start-app.sh"]
