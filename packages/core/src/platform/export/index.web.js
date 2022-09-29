import {
  effectScope as vueEffectScope,
  getCurrentScope as getCurrentVueScope,
  onScopeDispose,
  getCurrentInstance as getCurrentVueInstance
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
}

const effectScope = (detached) => fixEffectScope(vueEffectScope(detached))
const getCurrentScope = () => fixEffectScope(getCurrentVueScope())

export {
  effectScope,
  getCurrentScope,
  onScopeDispose
}

const getCurrentInstance = () => getCurrentVueInstance()?.__mpxProxy

export {
  getCurrentInstance
}

export {
  // i18n
  useI18n
} from 'vue-i18n-bridge'
