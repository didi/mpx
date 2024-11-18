const factoryMap = {
  App: require('../index').createApp,
  Page: require('../index').createPage,
  Component: require('../index').createComponent
}

module.exports = (type) => (...args) => {
  if (type === 'Behavior') {
    if (__mpx_mode__ === 'ali') {
      return Mixin.apply(null, args)
    }
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
  return factoryMap[type].apply(null, args.concat({ isNative: true }))
}
