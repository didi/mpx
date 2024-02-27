echo "start copy webpackPlugin"

#rm -rf ./node_modules/@mpxjs/webpack-plugin/lib ./node_modules/@mpxjs/utils/src ./node_modules/@mpxjs/store/src ./node_modules/@mpxjs/pinia/src ./node_modules/@mpxjs/core/src ./node_modules/@mpxjs/fetch/src ./node_modules/@mpxjs/api-proxy/src


cp -r ../../../packages/* ./node_modules/@mpxjs/

echo "end copy webpackPlugin"
