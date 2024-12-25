FROM oven/bun

WORKDIR /app

COPY ./package.json .
COPY ./prisma ./
COPY ./public ./

RUN bun install
RUN bunx prisma generate

COPY . .

EXPOSE 8000

CMD ["bun", "start"]
