import Vue from '../../vue'
import { injectMixins } from '../../core/injectMixins'

const vm = new Vue()
const observable = Vue.observable.bind(Vue)
const watch = vm.$watch.bind(vm)

const APIs = {
  injectMixins,
  mixin: injectMixins,
  observable,
  watch,
}


export {
  APIs,
  // InstanceAPIs
}
