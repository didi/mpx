import {
  effectScope as vueEffectScope,
  getCurrentScope as vueGetCurrentScope,
  getCurrentInstance as vueGetCurrentInstance,
  onScopeDispose
} from 'vue'

export {
  // watch
  watchEffect,
  watchSyncEffect,
  watchPostEffect,
  watch,
  // reactive
  reactive,
  isReactive,
  shallowReactive,
  set,
  del,
  markRaw,
  // ref
  ref,
  unref,
  toRef,
  toRefs,
  isRef,
  customRef,
  shallowRef,
  triggerRef,
  // computed
  computed
} from 'vue'

const noop = () => {
}

const fixEffectScope = (scope) => {
  scope.pause = noop
  scope.resume = noop
  return scope
}

const effectScope = (detached) => fixEffectScope(vueEffectScope(detached))
const getCurrentScope = () => fixEffectScope(vueGetCurrentScope())
const getCurrentInstance = () => vueGetCurrentInstance()?.proxy

export {
  // instance
  getCurrentInstance
}

export {
  // effectScope
  effectScope,
  getCurrentScope,
  onScopeDispose
}

export {
  // i18n
  useI18n
} from 'vue-i18n-bridge'
