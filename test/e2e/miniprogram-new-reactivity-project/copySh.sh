echo "start copy"

rm -rf ./node_modules/@mpxjs/core
rm -rf ./node_modules/@mpxjs/reactivity
rm -rf ./node_modules/@mpxjs/utils
rm -rf ./node_modules/@mpxjs/store

scp -r ../../../packages/core ./node_modules/@mpxjs/core
scp -r ../../../packages/reactivity ./node_modules/@mpxjs/reactivity
scp -r ../../../packages/utils ./node_modules/@mpxjs/utils
scp -r ../../../packages/store ./node_modules/@mpxjs/store

echo "end copy"