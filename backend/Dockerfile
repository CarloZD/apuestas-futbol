FROM node:22-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml* ./

RUN pnpm install --frozen-lockfile --strict-peer-dependencies=false || pnpm install

COPY . .

EXPOSE 3000

CMD ["node", "app.js"]
