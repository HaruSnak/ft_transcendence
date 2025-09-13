FROM node:18-slim

# Install required packages for SQLite
RUN apt-get update && apt-get install -y sqlite3 && rm -rf /var/lib/apt/lists/*

WORKDIR /srcs

COPY package*.json ./
RUN npm install

COPY . .

RUN mkdir -p /srcs/data && chmod 755 /srcs/data

EXPOSE 3003

CMD ["node", "srcs/server.js"]