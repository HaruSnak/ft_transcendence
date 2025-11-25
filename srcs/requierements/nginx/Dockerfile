FROM nginx:alpine

# Générer des certificats SSL auto-signés
RUN apk add --no-cache openssl && \
	openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
	-keyout /etc/ssl/private/nginx-selfsigned.key \
	-out /etc/ssl/certs/nginx-selfsigned.crt \
	-subj "/C=CH/ST=Vaud/L=Lausanne/O=42School/OU=Transcendence/CN=localhost"

# Copy nginx configuration into the image (no bind-mount needed)
COPY nginx/conf/nginx.conf /etc/nginx/nginx.conf

# Copy all pre-built frontend files into the image (no bind-mount needed)
COPY frontend/public/ /usr/share/nginx/html/public/
COPY frontend/src/ /usr/share/nginx/html/src/

EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]