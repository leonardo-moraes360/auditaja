#!/bin/sh
set -e

TIPO="${TIPO:-manutencao}"

if [ "$TIPO" = "judicial" ]; then
    envsubst '${BLOCKED_BY_URL}' < /etc/nginx/templates/judicial.conf.template > /etc/nginx/conf.d/default.conf
    cp /usr/share/nginx/html/judicial.html /usr/share/nginx/html/index.html
else
    envsubst '${RETRY_AFTER}' < /etc/nginx/templates/manutencao.conf.template > /etc/nginx/conf.d/default.conf
    cp /usr/share/nginx/html/manutencao.html /usr/share/nginx/html/index.html
fi

exec "$@"
