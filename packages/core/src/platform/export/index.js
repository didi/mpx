
export {
  watchEffect,
  watchSyncEffect,
  watchPostEffect,
  watch
} from '../../observer/watch'

// export {
//   reactive,
//   isReactive,
//   shallowReactive,
//   set,
//   del,
//   markRaw
// } from '../../observer/reactive'

export {
  reactive,
  isReactive,
  shallowReactive,
  markRaw,
  ref,
  unref,
  toRef,
  toRefs,
  isRef,
  customRef,
  shallowRef,
  triggerRef
} from '@vue/reactivity'

// export {
//   ref,
//   unref,
//   toRef,
//   toRefs,
//   isRef,
//   customRef,
//   shallowRef,
//   triggerRef
// } from '../../observer/ref'

// export {
//   computed
// } from '../../observer/computed'

export {
  computed
} from '@vue/reactivity'

// export {
//   effectScope,
//   getCurrentScope,
//   onScopeDispose
// } from '../../observer/effectScope'

export {
  effectScope,
  getCurrentScope,
  onScopeDispose
} from '@vue/reactivity'

export {
  getCurrentInstance
} from '../../core/proxy'

export {
  useI18n
} from '../../platform/builtInMixins/i18nMixin'
