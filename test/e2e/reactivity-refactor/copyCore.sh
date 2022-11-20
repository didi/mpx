echo "start copy core"

rm -rf ./node_modules/@mpxjs/core

scp -r ../../../packages/core ./node_modules/@mpxjs/core

echo "end copy core"
