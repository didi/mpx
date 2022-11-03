import Vue from '../../vue'
import { injectMixins } from '../../core/injectMixins'

const vm = new Vue()
const observable = Vue.observable.bind(Vue)
const watch = vm.$watch.bind(vm)
const set = Vue.set.bind(Vue)
const del = Vue.delete.bind(Vue)

const APIs = {
  injectMixins,
  mixin: injectMixins,
  observable,
  watch,
  set,
  delete: del
}

const InstanceAPIs = {}

export {
  APIs,
  InstanceAPIs
}
