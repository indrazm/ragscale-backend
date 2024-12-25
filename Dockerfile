FROM oven/bun

WORKDIR /app

COPY ./package.json .
COPY ./prisma ./

RUN bun install
RUN bunx prisma generate

COPY . .

EXPOSE 3000

CMD ["bun", "start"]
