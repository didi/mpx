echo "start copy webpackPlugin"

rm -rf ./node_modules/@mpxjs/webpack-plugin/lib ./node_modules/@mpxjs/utils/src ./node_modules/@mpxjs/store/src ./node_modules/@mpxjs/pinia/src ./node_modules/@mpxjs/core/src ./node_modules/@mpxjs/fetch/src ./node_modules/@mpxjs/api-proxy/src

cp -r ../../../packages/webpack-plugin/lib/ ./node_modules/@mpxjs/webpack-plugin/lib/
cp -r ../../../packages/utils/src/ ./node_modules/@mpxjs/utils/src/
cp -r ../../../packages/store/src/ ./node_modules/@mpxjs/store/src/
cp -r ../../../packages/pinia/src/ ./node_modules/@mpxjs/pinia/src/
cp -r ../../../packages/core/src/ ./node_modules/@mpxjs/core/src/
cp -r ../../../packages/fetch/src/ ./node_modules/@mpxjs/fetch/src/
cp -r ../../../packages/api-proxy/src/ ./node_modules/@mpxjs/api-proxy/src/

echo "end copy webpackPlugin"
