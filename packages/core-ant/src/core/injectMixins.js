import {
  type as obType
} from '../helper/utils'
const MIXINS_MAPS = {
  app: [],
  page: [],
  component: []
}
export function injectMixins (mixins, type) {
  if (!type) {
    type = ['app', 'page', 'component']
  } else if (obType(type) === 'String') {
    type = [type]
  }
  if (obType(mixins) === 'Object') {
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
