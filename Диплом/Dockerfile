FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY tsconfig.base.json ./
COPY apps/server/package.json ./apps/server/package.json

RUN npm install

COPY apps/server ./apps/server

WORKDIR /app/apps/server

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
