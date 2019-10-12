const mpx = require('../index')

module.exports = (type) => (...args) => {
  if (type === 'Behavior') {
    // eslint-disable-next-line
    args[0].__mpx_behaviors_to_mixins__ = true
    return args[0]
  }
  return mpx[`create${type}`] && mpx[`create${type}`].apply(null, args.concat({ isNative: true }))
}
