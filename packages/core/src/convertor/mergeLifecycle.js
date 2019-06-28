import { INNER_LIFECYCLES } from '../core/innerLifecycle'
export function mergeLifecycle (lifecycle) {
  if (lifecycle) {
    const pageHooks = (lifecycle.PAGE_HOOKS || []).concat(INNER_LIFECYCLES)
    const componentHooks = (lifecycle.COMPONENT_HOOKS || []).concat(INNER_LIFECYCLES)
    return {
      'app': lifecycle.APP_HOOKS || [],
      'page': pageHooks,
      'component': componentHooks,
      'blend': pageHooks.concat(lifecycle.COMPONENT_HOOKS || [])
    }
  }
}
