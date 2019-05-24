const mpx = require('../index')

module.exports = (type) => (...args) => {
  return mpx[`create${type}`] && mpx[`create${type}`].apply(null, args.concat({ isNative: true }))
}
