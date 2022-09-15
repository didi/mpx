import Vue from '../../vue'
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
    delete: del
  }
  return APIs
}
let APIs = initApi()
const InstanceAPIs = {}
export {
  APIs,
  InstanceAPIs
}
