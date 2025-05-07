FROM node:20-alpine

WORKDIR /app

COPY backend/package.json backend/package-lock.json ./

RUN npm install
RUN npm install speakeasy qrcode better-sqlite3 dotenv
RUN npm audit fix

COPY backend/srcs ./srcs

CMD ["npm", "start"]