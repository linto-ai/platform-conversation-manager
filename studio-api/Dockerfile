FROM node:20.15.1

RUN apt-get update -y && \
  apt-get install -y \
  gettext \
  ffmpeg \
  cron \
  zip \
  build-essential \
  libboost-program-options-dev \
  libboost-filesystem-dev \
  libboost-date-time-dev \
  libboost-regex-dev \
  libmad0-dev \
  libid3tag0-dev \
  libgd-dev && \
  apt-get install -y libreoffice --fix-missing 

RUN apt update -y && apt install -y libreoffice --fix-missing

WORKDIR /usr/src/app/conversation-manager
COPY . /usr/src/app/conversation-manager

# Move binaries to their respective locations
RUN cp config/bin/yt-dlp_linux /usr/local/bin/yt-dlp

RUN npm install

# Set up cron job with
RUN chmod 0644 config/cron/backup-cron && \
  crontab config/cron/backup-cron

RUN service cron start

RUN chown -R node:node /usr/src/app/
USER node

HEALTHCHECK CMD curl -f http://localhost || exit 1
EXPOSE 80

COPY wait-for-it.sh /
COPY docker-entrypoint.sh /
ENTRYPOINT ["/docker-entrypoint.sh"]
