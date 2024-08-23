import { set, del, reactive, isReactive } from '../../observer/reactive'
import { isRef } from '../../observer/ref'
import { watch } from '../../observer/watch'
import { injectMixins } from '../../core/injectMixins'

const APIs = {
  injectMixins,
  mixin: injectMixins,
  observable: reactive,
  watch,
  set,
  delete: del,
  isReactive,
  isRef
}

const InstanceAPIs = {
  $set: set,
  $delete: del
}

export {
  APIs,
  InstanceAPIs
}
