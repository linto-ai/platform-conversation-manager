#!/bin/bash
set -e

DIR="/usr/src/app/conversation-manager-front/dist/"
BUILD=false

if [ ! -d "$DIR" ]; then
  BUILD=true
  # Take action if $DIR exists. #
  echo "Building ${DIR}..."
  printenv >.env
  npm run build
  rm -rf /usr/share/nginx/html/*
  cp -r ./dist/* /usr/share/nginx/html
else
  echo "Directory ${DIR} exists, skipping build..."
  cp -r ./dist/* /usr/share/nginx/html
fi

while [ "$1" != "" ]; do
  case $1 in
  --build)
    printenv >.env
    npm run build
    rm -rf /usr/share/nginx/html/*
    cp -r ./dist/* /usr/share/nginx/html
    ;;
  --skip)
    echo 'Skip startup param'
    ;;
  *)
    echo "ERROR: Bad argument provided \"$1\""
    exit 1
    ;;
  esac
  shift
done

if [ -z "$WEBSERVER_HTTP_PORT" ]; then
  echo "WEBSERVER_HTTP_PORT is not set. Defaulting to port 80."
  WEBSERVER_HTTP_PORT=80
fi

echo "Nginx port set to: ${WEBSERVER_HTTP_PORT}"
cp /etc/nginx/nginx.conf /tmp/nginx.conf
sed -i "s/listen [0-9]\+;/listen ${WEBSERVER_HTTP_PORT};/" /tmp/nginx.conf
cp /tmp/nginx.conf /etc/nginx/nginx.conf

echo "Starting Nginx..."
nginx
