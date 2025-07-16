export {
  watchEffect,
  watchSyncEffect,
  watchPostEffect,
  watch
} from '../../observer/watch'

export {
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
  computed,
  // instance
  getCurrentScope,
  // effectScope
  effectScope,
  onScopeDispose
} from '@mpxjs/reactivity'

export {
  getCurrentInstance
} from '../../core/proxy'

export {
  useI18n
} from '../../platform/builtInMixins/i18nMixin'

export {
  provide,
  inject
} from './inject'
