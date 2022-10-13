echo "start copy webpackPlugin"

rm -rf ./node_modules/@mpxjs/webpack-plugin/lib

scp -r ../../../packages/webpack-plugin/lib/ ./node_modules/@mpxjs/webpack-plugin/lib/

echo "end copy webpackPlugin"
