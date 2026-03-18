FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# No EXPOSE needed because it's purely an asynchronous background worker taking no HTTP traffic!
CMD ["node", "index.js"]
