#!/bin/sh
docker build --platform linux/riscv64 -t app:1.0 .
docker save app:1.0 | gzip -c > genesis/app/docker.tar.gz

