FROM node:20-alpine

WORKDIR /app

COPY ./frontend/package.json ./frontend/package-lock.json ./
RUN npm install && npm install chart.js

COPY ./frontend ./

RUN npm run build

CMD ["npx", "vite", "preview", "--host"]
