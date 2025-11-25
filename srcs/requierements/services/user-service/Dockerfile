FROM node:22-alpine

WORKDIR /srcs

COPY package*.json ./
RUN npm install

RUN if ! getent group srcsgroup > /dev/null 2>&1; then \
      addgroup -g 1001 -S srcsgroup; \
    fi && \
    adduser -u 1001 -S srcsuser -G srcsgroup

COPY . .

RUN mkdir -p /srcs/data && chown -R srcsuser:srcsgroup /srcs

USER srcsuser

EXPOSE 3003

CMD ["node", "srcs/server.js"]