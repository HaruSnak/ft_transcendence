FROM node:18-alpine

WORKDIR /srcs

COPY package*.json ./
RUN npm install

RUN if ! getent group srcsgroup > /dev/null 2>&1; then \
      addgroup -g 1001 -S srcsgroup; \
    fi && \
    adduser -u 1001 -S srcsuser -G srcsgroup

COPY . .

USER srcsuser

EXPOSE 3002

CMD ["node", "srcs/server.js"]