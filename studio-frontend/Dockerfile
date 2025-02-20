FROM node:20.15.1 as builder

RUN apt-get update -y && \
  apt-get install gettext -y && \
  apt-get install nginx -y

# Copy project in default workdir
WORKDIR /usr/src/app/conversation-manager-front
COPY . /usr/src/app/conversation-manager-front
RUN npm install 

RUN rm -rf /usr/share/nginx/html/*
COPY ./config/nginx/nginx.conf /etc/nginx/nginx.conf
RUN chown node:node /etc/nginx/nginx.conf \
    && chmod u+w /etc/nginx/nginx.conf

COPY ./docker-entrypoint.sh /

RUN chown -R node:node /usr/src/app /usr/share/nginx/html /var/lib/nginx /var/log/nginx && \
  touch /run/nginx.pid && chown -R node:node /run/nginx.pid
USER node

HEALTHCHECK CMD curl -f http://localhost

EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
