const mpx = require('../index')

module.exports = (type) => (...args) => {
  if (type === 'Behavior') {
    return args[0]
  }
  return mpx[`create${type}`] && mpx[`create${type}`].apply(null, args.concat({ isNative: true }))
}
