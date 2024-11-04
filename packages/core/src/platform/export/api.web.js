import {
  watch,
  reactive,
  isReactive,
  set,
  del,
  isRef
} from 'vue'
import { injectMixins } from '../../core/injectMixins'
import { provideApp } from './apiInject'

const APIs = {
  injectMixins,
  mixin: injectMixins,
  observable: reactive,
  watch,
  set,
  delete: del,
  isReactive,
  isRef,
  provide: provideApp
}

const InstanceAPIs = {}

export {
  APIs,
  InstanceAPIs
}
