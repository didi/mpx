import { EffectScope } from '../observer/effectScope'
import { ref } from '../observer/ref'

/**
 * @description: create mpxStore instance, only called once through entire lifecycle of miniApp
 * @return {*} store instance
 */
export default function createStore() {
  // create scope for current instance
  const scope = new EffectScope(true)
  const state = scope.run(() => { ref({}) })

  // let _p = []
  // let toBeInstalled = []

  const mpxStore = {
    /* install (_app) {
      mpxStore._a = _app
      _app.config.globalProperties.$mpxStore = mpxStore
      toBeInstalled.forEach((plugin) => _p.push(plugin))
      toBeInstalled = []
    },
    use(plugin) {
      if (!this._a) {
        toBeInstalled.push(plugin)
      } else {
        _p.push(plugin)
      }
      return this
    }, 
    _p,*/
    _a: null,
    _e: scope,
    _s: new Map(),
    state
  }

  return mpxStore
}