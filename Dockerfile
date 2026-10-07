FROM node:24-bookworm-slim
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.19.0 --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile --ignore-scripts
COPY backend ./backend
COPY shared ./shared
COPY dist ./dist
COPY scripts/build-shared.mjs ./scripts/build-shared.mjs
COPY server.mjs ./
RUN node scripts/build-shared.mjs
RUN mkdir -p /app/data && chown node:node /app/data
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8080
USER node
EXPOSE 8080
CMD ["node", "server.mjs"]
