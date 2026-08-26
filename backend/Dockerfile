FROM node:20-alpine

RUN apk add --no-cache openssl wget

WORKDIR /app

COPY package.json ./
COPY prisma ./prisma

RUN npm install && npx prisma generate

COPY src ./src
COPY prisma ./prisma
COPY tests ./tests

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 4000

HEALTHCHECK --interval=15s --timeout=5s --retries=5 CMD wget -qO- http://127.0.0.1:4000/health || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]
