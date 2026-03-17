FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npm run build

FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/package-lock.json ./package-lock.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/server.ts ./server.ts
COPY --from=build /app/tsconfig.json ./tsconfig.json
COPY --from=build /app/dist ./dist

EXPOSE 3005

CMD ["node", "--import", "tsx", "server.ts"]