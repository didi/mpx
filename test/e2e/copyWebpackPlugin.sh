echo "start copy webpackPlugin"

cp -r ../../../packages/* ./node_modules/@mpxjs/

rm -rf ./node_modules/@mpxjs/webpack-plugin/node_modules/webpack

echo "end copy webpackPlugin"
