FROM --platform=linux/riscv64 cartesi/node:jammy-slim AS deps
WORKDIR /app

COPY babel.config.js jest.config.ts package.json tsconfig.json yarn.lock .
COPY src ./src
RUN yarn install --frozen-lockfile
RUN yarn add tslib
RUN npx tsc --build

FROM --platform=linux/riscv64 cartesi/node:jammy-slim AS image

WORKDIR /app
COPY babel.config.js jest.config.ts package.json tsconfig.json yarn.lock .
RUN yarn install --production --frozen-lockfile && yarn cache clean
COPY --from=deps /app/dist /app/dist
FROM scratch
COPY --from=image / /
WORKDIR /app
CMD node ./dist/index.js

