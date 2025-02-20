FROM node:20.15.1

WORKDIR /usr/src/app

COPY package.json ./

RUN npm install
COPY . .

# Create a non-root user and group named linto & change ownership of the application files
RUN chown -R node:node /usr/src/app
USER node

HEALTHCHECK CMD curl -f http://localhost
EXPOSE 80

CMD ["npm", "run", "start"]
