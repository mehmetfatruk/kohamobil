# syntax=docker/dockerfile:1.7
# Gateway API + worker image'ı (aynı image, farklı komut).
FROM node:22-alpine AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable
WORKDIR /repo

FROM base AS build
COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter "@mirakil/api..."
RUN pnpm turbo run build --filter="@mirakil/api..."
RUN pnpm deploy --filter=@mirakil/api --prod --legacy /out

FROM node:22-alpine AS runtime
ARG GATEWAY_VERSION=0.1.0-dev
ENV NODE_ENV=production GATEWAY_VERSION=$GATEWAY_VERSION
WORKDIR /app
COPY --from=build --chown=node:node /out ./
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
