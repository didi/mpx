echo "start copy"

rm -rf ./node_modules/@mpxjs/core
rm -rf ./node_modules/@mpxjs/utils

scp -r ../../../packages/core ./node_modules/@mpxjs/core
scp -r ../../../packages/utils ./node_modules/@mpxjs/utils

echo "end copy"