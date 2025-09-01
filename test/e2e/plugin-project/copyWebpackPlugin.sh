echo "start copy webpackPlugin"

rm -rf ./node_modules/@mpxjs/webpack-plugin/lib
rm -rf ./node_modules/@mpxjs/core/src

scp -r ../../../packages/webpack-plugin/lib/ ./node_modules/@mpxjs/webpack-plugin/lib/
scp -r ../../../packages/core/src/ ./node_modules/@mpxjs/core/src/

echo "end copy webpackPlugin"
