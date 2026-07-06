ARG NODE_IMAGE=node:24.18.0-bookworm-slim

# Stage 1: Build
FROM ${NODE_IMAGE} AS builder
WORKDIR /app
RUN corepack enable
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
COPY client/package.json ./client/
COPY server/package.json ./server/
COPY shared/package.json ./shared/
COPY integration/package.json ./integration/

COPY scripts/install.sh scripts/install.sh
RUN ./scripts/install.sh
COPY . .
RUN ./scripts/build.sh

# Stage 2: Run
FROM ${NODE_IMAGE}
WORKDIR /app
RUN corepack enable
COPY --from=builder /app .
COPY server ./server
EXPOSE 3006
WORKDIR /app/server
CMD ["yarn", "start:prod"]
