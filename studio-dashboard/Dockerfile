FROM node:18

WORKDIR /usr/src/app/dashboard

COPY package.json ./
COPY wait-for-it.sh /
COPY docker-entrypoint.sh /

RUN npm install
COPY . .

# Create a non-root user and group named linto & change ownership of the application files
RUN chown -R node:node /usr/src/app
USER node

EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]