
import Vue from '../../vue'
import implement from '../../core/implement'
import { set, del, reactive } from '../../observer/reactive'
import { watch } from '../../observer/watch'
import { injectMixins } from '../../core/injectMixins'


function initApi () {
  const vm = new Vue()
  const observable = Vue.observable.bind(Vue)
  const watch = vm.$watch.bind(vm)
  const set = Vue.set.bind(Vue)
  const del = Vue.delete.bind(Vue)
  APIs = {
    injectMixins,
    mixin: injectMixins,
    observable,
    watch,
    // use,
    set,
    delete: del,
    implement
  }
  return APIs
}
let APIs = initApi()
let InstanceAPIs = {}
export {
  Vue,
  APIs,
  InstanceAPIs
}

export {
  set,
  del
}
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
  // ref环节
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
  // advanced
  effectScope,
  getCurrentScope,
  onScopeDispose,
  // instance
  getCurrentInstance
} from '@vue/composition-api'