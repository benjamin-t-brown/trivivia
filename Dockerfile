# Stage 1: Build
FROM node:lts-bookworm-slim AS builder
WORKDIR /app
RUN corepack enable
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
COPY client/package.json ./client/
COPY server/package.json ./server/
COPY shared/package.json ./shared/
COPY integration/package.json ./integration/

COPY install.sh .
RUN ./install.sh
COPY . .
RUN ./build.sh

# Stage 2: Run
FROM node:lts-bookworm-slim
WORKDIR /app
RUN corepack enable
COPY --from=builder /app .
COPY server ./server
EXPOSE 3006
WORKDIR /app/server
CMD ["yarn", "start:prod"]
