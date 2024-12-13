export {
  watchEffect,
  watchSyncEffect,
  watchPostEffect,
  watch
} from '../../observer/watch'

export {
  reactive,
  isReactive,
  shallowReactive,
  set,
  del,
  markRaw
} from '../../observer/reactive'

export {
  ref,
  unref,
  toRef,
  toRefs,
  isRef,
  customRef,
  shallowRef,
  triggerRef
} from '../../observer/ref'

export {
  computed
} from '../../observer/computed'

export {
  effectScope,
  getCurrentScope,
  onScopeDispose
} from '../../observer/effectScope'

export {
  getCurrentInstance
} from '../../core/proxy'

export {
  useI18n
} from '../../platform/builtInMixins/i18nMixin'

export {
  provide,
  inject
} from './apiInject'
