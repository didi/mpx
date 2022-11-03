import { effectScope, ref, markRaw } from '@mpxjs/core'
import { setActivePinia } from './util'

/**
 * @description: create pinia instance, only called once through entire lifecycle of miniApp
 * @return {*} pinia
 */
export function createPinia () {
  const scope = effectScope(true)
  // create ref state
  const state = scope.run(() => ref({}))
  const _p = []
  const pinia = markRaw({
    install () {
      setActivePinia(pinia)
    },
    use (plugin) {
      _p.push(plugin)
      return this
    },
    _p,
    _a: null,
    _e: scope,
    _s: new Map(),
    state
  })
  return pinia
}
