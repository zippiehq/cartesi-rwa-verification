FROM --platform=linux/riscv64 cartesi/node:jammy-slim AS deps
WORKDIR /app

COPY . .
RUN yarn install --frozen-lockfile
RUN yarn add tslib
RUN npx tsc --build

FROM --platform=linux/riscv64 cartesi/node:jammy-slim AS image

WORKDIR /app
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/dist /app/dist


FROM scratch
COPY --from=image / /
WORKDIR /app
CMD node ./dist/index.js

