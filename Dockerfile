FROM --platform=linux/riscv64 ghcr.io/stskeeps/node:20-jammy-slim-estargz AS deps
WORKDIR /app

COPY babel.config.js jest.config.ts package.json tsconfig.json yarn.lock .
COPY src ./src
RUN yarn install --frozen-lockfile
RUN yarn add tslib
RUN npx tsc --build

FROM --platform=linux/riscv64 ghcr.io/stskeeps/node:20-jammy-slim-estargz AS image
WORKDIR /app
COPY babel.config.js jest.config.ts package.json tsconfig.json yarn.lock .
RUN yarn install --production --frozen-lockfile && yarn cache clean
COPY --from=deps /app/dist /app/dist
ENV ROLLUP_HTTP_SERVER=http://127.0.0.1:5004
CMD node ./dist/index.js

