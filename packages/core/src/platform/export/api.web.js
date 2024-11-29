import {
  watch,
  reactive,
  isReactive,
  set,
  del,
  isRef
} from 'vue'
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

const InstanceAPIs = {}

export {
  APIs,
  InstanceAPIs
}
