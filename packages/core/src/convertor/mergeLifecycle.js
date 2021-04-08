import { INNER_LIFECYCLES } from '../core/innerLifecycle'

export function mergeLifecycle (lifecycle) {
  if (lifecycle) {
    const appHooks = (lifecycle.APP_HOOKS || []).concat(INNER_LIFECYCLES)
    const pageHooks = (lifecycle.PAGE_HOOKS || []).concat(INNER_LIFECYCLES)
    const componentHooks = (lifecycle.COMPONENT_HOOKS || []).concat(INNER_LIFECYCLES)
    return {
      'app': appHooks,
      'page': pageHooks,
      'component': componentHooks,
      'blend': pageHooks.concat(lifecycle.COMPONENT_HOOKS || [])
    }
  }
}

function mergeArrMap (target, source) {
  Object.keys(source).forEach((key) => {
    if (!target[key]) {
      target[key] = source[key].slice()
    } else {
      target[key] = target[key].concat(source[key])
    }
  })
}

export function mergeLifecycleProxyMap (target, ...sources) {
  sources.forEach((source) => {
    mergeArrMap(target, source)
  })
  return target
}
