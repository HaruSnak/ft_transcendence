FROM node:18-slim

# Install required packages for SQLite
RUN apt-get update && apt-get install -y sqlite3 && rm -rf /var/lib/apt/lists/*

WORKDIR /srcs

COPY package*.json ./
RUN npm install

# Create non-root user for security
RUN groupadd -g 1001 srcsgroup && \
    useradd -u 1001 -g srcsgroup -s /bin/bash -m srcsuser

COPY . .

RUN mkdir -p /srcs/data && chown -R srcsuser:srcsgroup /srcs

USER srcsuser

EXPOSE 3003

CMD ["node", "srcs/server.js"]