# Build server
FROM node:22-alpine AS server-build
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci
COPY server/ ./
RUN npm run build

# Build client
FROM node:22-alpine AS client-build
WORKDIR /app/chess-challenge
COPY chess-challenge/package.json chess-challenge/package-lock.json ./
RUN npm ci && ls node_modules/@rolldown
COPY chess-challenge/ ./
RUN ls node_modules/@rolldown && npm run build

# Run em
FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
COPY --from=server-build /app/server/dist ./server/dist
COPY --from=server-build /app/server/package.json /app/server/package-lock.json ./server/
COPY --from=client-build /app/chess-challenge/dist ./client/dist
COPY --from=client-build /app/chess-challenge/package.json /app/chess-challenge/package-lock.json ./client/
RUN npm ci --omit=dev \
    && npm ci --omit=dev --prefix server \
    && npm ci --prefix client
EXPOSE 3000 3001
CMD ["npm", "run", "start"]