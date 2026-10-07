# syntax=docker/dockerfile:1.7
# Yönetim paneli: statik dosyalar, root olmayan Nginx.
FROM node:22-alpine AS build
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable
WORKDIR /repo
COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter "@mirakil/admin..."
RUN pnpm turbo run build --filter="@mirakil/admin..."

FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime
COPY infra/docker/admin.nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/admin/dist /usr/share/nginx/html
EXPOSE 8080
