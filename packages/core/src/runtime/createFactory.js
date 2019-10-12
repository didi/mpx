const mpx = require('../index')

module.exports = (type) => (...args) => {
  if (type === 'Behavior') {
    if (args[0]) {
      Object.defineProperty(args[0], '__mpx_behaviors_to_mixins__', {
        configurable: true,
        enumerable: false,
        get () {
          return true
        }
      })
    }
    return args[0]
  }
  return mpx[`create${type}`] && mpx[`create${type}`].apply(null, args.concat({ isNative: true }))
}
