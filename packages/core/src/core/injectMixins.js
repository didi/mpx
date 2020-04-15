const MIXINS_MAPS = {
  app: [],
  page: [],
  component: []
}

export function injectMixins (mixins, type) {
  if (typeof type === 'string') {
    type = [type]
  } else {
    type = ['app', 'page', 'component']
  }

  if (!Array.isArray(mixins)) {
    mixins = [mixins]
  }
  type.forEach(key => {
    const curMixins = MIXINS_MAPS[key]
    if (curMixins) {
      for (const mixin of mixins) {
        curMixins.indexOf(mixin) === -1 && curMixins.push(mixin)
      }
    }
  })
  return this
}

export function getInjectedMixins (type) {
  return MIXINS_MAPS[type].slice(0)
}

export function mergeInjectedMixins (options, type) {
  const injectedMixins = getInjectedMixins(type)
  if (injectedMixins.length) {
    options.mixins = options.mixins ? injectedMixins.concat(options.mixins) : injectedMixins
  }
  return options
}
