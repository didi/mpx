echo "start copy webpackPlugin"

rm -rf ./node_modules/@mpxjs/webpack-plugin/lib

scp -r ../../../packages/webpack-plugin/lib/ ./node_modules/@mpxjs/webpack-plugin/lib/

echo "end copy webpackPlugin"

echo "start copy core"

rm -rf ./node_modules/@mpxjs/core/src

scp -r ../../../packages/core/src/ ./node_modules/@mpxjs/core/src/

echo "end copy core"


echo "start copy utils"

rm -rf ./node_modules/@mpxjs/utils/src

scp -r ../../../packages/@mpxjs/utils/src/ ./node_modules/@mpxjs/@mpxjs/utils/src/

echo "end copy utils"

