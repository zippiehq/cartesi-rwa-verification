#!/bin/sh
docker build --platform linux/riscv64 -t app:1.0 .
docker save app:1.0 > docker.tar
skopeo copy docker-archive:docker.tar oci:oci:latest
umoci unpack --image oci bundle
rm -rf oci
jq '.process.env += ["ROLLUP_HTTP_SERVER=http://127.0.0.1:5004"]' bundle/config.json > bundle/config.json.new
jq '.process.terminal = false' bundle/config.json > bundle/config.json.new2
# host network
jq '.linux.namespaces |= map(select(.type != "network"))' bundle/config.json.new2 > bundle/config.json
rm -f bundle/config.json.new bundle/config.json.new2
tar -C bundle -zcf genesis/app/bundle.tar.gz .
rm -rf bundle
rm docker.tar
