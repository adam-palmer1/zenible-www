FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 8021

CMD ["npx", "vite", "--host", "0.0.0.0", "--port", "8021"]
