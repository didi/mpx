
import Vue from '../../vue'
import implement from '../../core/implement'
import { set, del, reactive } from '../../observer/reactive'
import { watch } from '../../observer/watch'
import { injectMixins } from '../../core/injectMixins'

let APIs = {
  injectMixins,
  mixin: injectMixins,
  observable: reactive,
  watch,
  // use,
  set,
  delete: del,
  implement
}

let InstanceAPIs = {
  $set: set,
  $delete: del
}

export {
  Vue,
  APIs,
  InstanceAPIs
}

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
  del
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
