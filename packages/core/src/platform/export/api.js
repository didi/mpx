// import { set, del, reactive } from '../../observer/reactive'
import { reactive } from '@vue/reactivity'
import { watch } from '../../observer/watch'
import { injectMixins } from '../../core/injectMixins'

const APIs = {
  injectMixins,
  mixin: injectMixins,
  observable: reactive,
  watch,
}

export {
  APIs,
  InstanceAPIs
}
