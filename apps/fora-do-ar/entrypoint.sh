#!/bin/sh
set -e

escape_html() {
    printf '%s' "$1" | sed \
        -e 's/&/\&amp;/g' \
        -e 's/</\&lt;/g' \
        -e 's/>/\&gt;/g' \
        -e 's/"/\&quot;/g' \
        -e "s/'/\&#39;/g"
}

escape_sed() {
    printf '%s' "$1" | sed -e 's/[&/\]/\\&/g'
}

build_line() {
    label="$1"
    value="$2"
    if [ -n "$value" ]; then
        escaped=$(escape_html "$value")
        printf '<p><strong>%s:</strong> %s</p>' "$label" "$escaped"
    fi
}

build_contato() {
    email="$1"
    if [ -n "$email" ]; then
        escaped=$(escape_html "$email")
        printf '<p>Dúvidas? Entre em contato: %s</p>' "$escaped"
    fi
}

TIPO="${TIPO:-manutencao}"

if [ "$TIPO" = "judicial" ]; then
    envsubst '${BLOCKED_BY_URL}' < /etc/nginx/templates/judicial.conf.template > /etc/nginx/conf.d/default.conf
    
    LINHA_AUTORIDADE=$(build_line "Autoridade" "$AUTORIDADE")
    LINHA_PROCESSO=$(build_line "Referência" "$NUMERO_PROCESSO")
    LINHA_DATA=$(build_line "Data" "$DATA_DETERMINACAO")
    LINHA_CONTATO=$(build_contato "$CONTATO_EMAIL")
    
    LINHA_AUTORIDADE_ESC=$(escape_sed "$LINHA_AUTORIDADE")
    LINHA_PROCESSO_ESC=$(escape_sed "$LINHA_PROCESSO")
    LINHA_DATA_ESC=$(escape_sed "$LINHA_DATA")
    LINHA_CONTATO_ESC=$(escape_sed "$LINHA_CONTATO")
    
    sed -e "s|{{LINHA_AUTORIDADE}}|$LINHA_AUTORIDADE_ESC|g" \
        -e "s|{{LINHA_PROCESSO}}|$LINHA_PROCESSO_ESC|g" \
        -e "s|{{LINHA_DATA}}|$LINHA_DATA_ESC|g" \
        -e "s|{{LINHA_CONTATO}}|$LINHA_CONTATO_ESC|g" \
        /usr/share/nginx/html/judicial.html > /usr/share/nginx/html/index.html
else
    envsubst '${RETRY_AFTER}' < /etc/nginx/templates/manutencao.conf.template > /etc/nginx/conf.d/default.conf
    
    LINHA_PREVISAO=$(build_line "Previsão de retorno" "$PREVISAO_RETORNO")
    LINHA_MOTIVO=$(build_line "Motivo" "$MOTIVO")
    LINHA_CONTATO=$(build_contato "$CONTATO_EMAIL")
    
    LINHA_PREVISAO_ESC=$(escape_sed "$LINHA_PREVISAO")
    LINHA_MOTIVO_ESC=$(escape_sed "$LINHA_MOTIVO")
    LINHA_CONTATO_ESC=$(escape_sed "$LINHA_CONTATO")
    
    sed -e "s|{{LINHA_PREVISAO}}|$LINHA_PREVISAO_ESC|g" \
        -e "s|{{LINHA_MOTIVO}}|$LINHA_MOTIVO_ESC|g" \
        -e "s|{{LINHA_CONTATO}}|$LINHA_CONTATO_ESC|g" \
        /usr/share/nginx/html/manutencao.html > /usr/share/nginx/html/index.html
fi

exec "$@"
