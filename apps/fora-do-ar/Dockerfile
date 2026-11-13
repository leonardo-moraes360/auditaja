FROM nginx:1.27-alpine

WORKDIR /usr/share/nginx/html

COPY favicon.ico .
COPY styles.css .
COPY manutencao.html /usr/share/nginx/html/manutencao.html
COPY judicial.html /usr/share/nginx/html/judicial.html
COPY nginx-manutencao.conf /etc/nginx/templates/manutencao.conf.template
COPY nginx-judicial.conf /etc/nginx/templates/judicial.conf.template
COPY entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh && \
    rm -f /etc/nginx/conf.d/default.conf

ENV TIPO=manutencao
ENV RETRY_AFTER=3600
ENV BLOCKED_BY_URL=https://example.gov.br

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
