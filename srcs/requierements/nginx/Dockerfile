FROM nginx:alpine

# Générer des certificats SSL auto-signés
RUN apk add --no-cache openssl && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/private/nginx-selfsigned.key \
    -out /etc/ssl/certs/nginx-selfsigned.crt \
    -subj "/C=CH/ST=Vaud/L=Lausanne/O=42School/OU=Transcendence/CN=localhost"

COPY nginx/conf/nginx.conf /etc/nginx/nginx.conf

COPY frontend/ /usr/share/nginx/html/

EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]