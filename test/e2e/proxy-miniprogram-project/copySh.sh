echo "start copy"

rm -rf ./node_modules/@mpxjs/core
rm -rf ./node_modules/@mpxjs/utils
rm -rf ./node_modules/@mpxjs/webpack-plugin/lib
rm -rf ./node_modules/@mpxjs/api-proxy/src

scp -r ../../../packages/core ./node_modules/@mpxjs/core
scp -r ../../../packages/utils ./node_modules/@mpxjs/utils
scp -r ../../../packages/webpack-plugin/lib/ ./node_modules/@mpxjs/webpack-plugin/lib/
scp -r ../../../packages/api-proxy/src/ ./node_modules/@mpxjs/api-proxy/src/

echo "end copy"