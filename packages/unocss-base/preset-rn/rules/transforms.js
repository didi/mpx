import { transforms } from '@unocss/preset-mini/rules'

const transformBase = {
  '--un-rotate': '0deg',
  '--un-rotate-x': '0deg',
  '--un-rotate-y': '0deg',
  '--un-rotate-z': '0deg',
  '--un-scale-x': 1,
  '--un-scale-y': 1,
  '--un-scale-z': 1,
  '--un-skew-x': '0deg',
  '--un-skew-y': '0deg',
  '--un-translate-x': 0,
  '--un-translate-y': 0,
  '--un-translate-z': 0
}

const checkVars = [
  '--un-rotate',
  '--un-rotate-x',
  '--un-rotate-y',
  '--un-rotate-z',
  '--un-skew-x',
  '--un-skew-y'
]

function normalizeTransformVar (res) {
  checkVars.forEach(key => {
    if (res[key] !== undefined && res[key] === 0) {
      res[key] = '0deg'
    }
  })
  return res
}

function getPreflight (preflightKeys) {
  return Object.fromEntries(preflightKeys.map(key => [key, transformBase[key]]))
}

const removedKeys = [
  'scaleZ(var(--un-scale-z))',
  'translateZ(var(--un-translate-z))'
]

function normalizeTransform (transform) {
  if (!transform) return transform
  return transform
    .split(' ')
    .filter(v => !removedKeys.includes(v))
    .join(' ')
}

const transformRules = transforms.map(v => {
  const [regex, matcher, ...another] = v
  const options = another[0]
  if (options && options.custom && options.custom.preflightKeys) {
    if (typeof matcher === 'function') {
      return [
        regex,
        (...args) => {
          let res = matcher(...args)
          if (res) {
            if (Array.isArray(res)) {
              res = Object.fromEntries(res)
            }
            normalizeTransformVar(res)
            if (res.transform) {
              res.transform = normalizeTransform(res.transform)
            }
          }
          return res
        },
        ...another
      ]
    }
    if (typeof matcher === 'object') {
      matcher.transform = normalizeTransform(matcher.transform)
      const preflight = getPreflight(options.custom.preflightKeys)
      Object.assign(matcher, preflight)
    }
  }
  return v
})

export { transformRules as transforms, normalizeTransformVar }
