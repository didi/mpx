const fs = require('fs')
const path = require('path')

exports.lib = file => path.resolve(__dirname, '../', file)

exports.dep = dep => {
  if (
    fs.existsSync(path.resolve(__dirname, '../../node_modules', dep))
  ) {
    // npm 2 or npm linked
    return '@mpxjs/webpack-plugin/node_modules/' + dep
  } else {
    // npm 3
    return dep
  }
}
