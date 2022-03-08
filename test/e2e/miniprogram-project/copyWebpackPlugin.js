const { execSync } = require('child_process')
execSync('scp -r ../../../packages/webpack-plugin/lib/web/ ./node_modules/@mpxjs/webpack-plugin/lib/')
