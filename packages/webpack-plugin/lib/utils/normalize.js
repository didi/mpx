const path = require('path')

// exports.lib = file => path.resolve(__dirname, '../', file)
// support npm link debug
exports.lib = (file) => {
  return path.join(
    __dirname,
    '../',
    path.extname(file)?.length ? file : `${file}.js`
  )
}
