FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
# Run clean npm install
RUN npm ci --silent || npm install --silent

COPY . .

# Environment flag for production port setting
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "start"]
