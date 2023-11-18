import { reactive } from '@mpxjs/reactivity'
import { watch } from '../../runtime/apiWatch'
import { injectMixins } from '../../core/injectMixins'
import { set, del } from '@mpxjs/utils'

const APIs = {
  injectMixins,
  mixin: injectMixins,
  observable: reactive,
  watch,
  set,
  delete: del
}

const InstanceAPIs = {
  $set: set,
  $delete: del
}

export {
  APIs,
  InstanceAPIs
}
