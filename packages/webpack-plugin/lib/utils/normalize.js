// const path = require('path')

// exports.lib = file => path.resolve(__dirname, '../', file)
// support npm link debug
exports.lib = file => '@mpxjs/webpack-plugin/lib/' + file
