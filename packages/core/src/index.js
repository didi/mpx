import {
  toJS as toPureObject,
  extendObservable,
  observable,
  set,
  get,
  remove,
  has,
  values,
  keys,
  entries,
  action as createAction
} from './mobx'
import * as platform from './platform'
import createStore, { createStoreWithThis } from './core/createStore'
import { injectMixins } from './core/injectMixins'
import { watch } from './core/watcher'
import { extend } from './helper/utils'
import { setConvertRule } from './convertor/convertor'
import { getMixin } from './core/mergeOptions'
import { error } from './helper/log'
import Vue from './vue'

export function createApp (config, ...rest) {
  const mpx = new EXPORT_MPX()
  platform.createApp(extend({ proto: mpx.proto }, config), ...rest)
}

export function createPage (config, ...rest) {
  const mpx = new EXPORT_MPX()
  platform.createPage(extend({ proto: mpx.proto }, config), ...rest)
}

export function createComponent (config, ...rest) {
  const mpx = new EXPORT_MPX()
  platform.createComponent(extend({ proto: mpx.proto }, config), ...rest)
}

export { createStore, createStoreWithThis, toPureObject, observable, extendObservable, watch, createAction, getMixin }

export function getComputed (computed) {
  // ts computed类型推导辅助函数
  return computed
}

function extendProps (target, proxyObj, rawProps, option) {
  const keys = Object.getOwnPropertyNames(proxyObj)
  for (const key of keys) {
    if (APIs[key] || rawProps.indexOf(key) > -1) {
      continue
    } else if (option && (option.prefix || option.postfix)) {
      const transformKey = option.prefix
        ? option.prefix + '_' + key
        : key + '_' + option.postfix
      target[transformKey] = proxyObj[key]
    } else if (!target.hasOwnProperty(key)) {
      target[key] = proxyObj[key]
    } else {
      error(`Mpx property [${key}] from installing plugin conflicts with already exists，please pass prefix/postfix options to avoid property conflict, for example: "use('plugin', {prefix: 'mm'})"`)
    }
  }
}

// 安装插件进行扩展API
const installedPlugins = []

function use (plugin, options = {}) {
  if (installedPlugins.indexOf(plugin) > -1) {
    return this
  }

  const args = [options]
  const proxyMPX = factory()
  const rawProps = Object.getOwnPropertyNames(proxyMPX)
  const rawPrototypeProps = Object.getOwnPropertyNames(proxyMPX.prototype)
  args.unshift(proxyMPX)
  // 传入真正的mpx对象供插件访问
  args.push(EXPORT_MPX)
  if (typeof plugin.install === 'function') {
    plugin.install.apply(plugin, args)
  } else if (typeof plugin === 'function') {
    plugin.apply(null, args)
  }
  extendProps(EXPORT_MPX, proxyMPX, rawProps, options)
  extendProps(EXPORT_MPX.prototype, proxyMPX.prototype, rawPrototypeProps, options)
  installedPlugins.push(plugin)
  return this
}

let APIs = {}

// 实例属性
let InstanceAPIs = {}

if (__mpx_mode__ === 'web') {
  const vm = new Vue()
  const observable = Vue.observable.bind(Vue)
  const watch = vm.$watch.bind(vm)
  const set = Vue.set.bind(Vue)
  const remove = Vue.delete.bind(Vue)
  const get = function (target, key) {
    return target[key]
  }
  const has = function (target, key) {
    return target.hasOwnProperty(key)
  }
  const values = function (target) {
    return Object.values(target)
  }
  const keys = function (target) {
    return Object.keys(target)
  }
  const entries = function (target) {
    return Object.entries(target)
  }
  // todo 补齐web必要api
  APIs = {
    createApp,
    createPage,
    createComponent,
    createStore,
    createStoreWithThis,
    mixin: injectMixins,
    injectMixins,
    observable,
    watch,
    use,
    set,
    get,
    remove,
    has,
    keys,
    values,
    entries,
    setConvertRule,
    getMixin,
    getComputed
  }

  InstanceAPIs = {
    $set: set,
    $get: get,
    $remove: remove,
    $has: has,
    $keys: keys,
    $values: values,
    $entries: entries
  }
} else {
  APIs = {
    createApp,
    createPage,
    createComponent,
    createStore,
    createStoreWithThis,
    toPureObject,
    mixin: injectMixins,
    injectMixins,
    observable,
    extendObservable,
    watch,
    use,
    set,
    get,
    remove,
    has,
    keys,
    values,
    entries,
    setConvertRule,
    createAction,
    getMixin,
    getComputed
  }

  InstanceAPIs = {
    $set: set,
    $get: get,
    $remove: remove,
    $has: has,
    $keys: keys,
    $values: values,
    $entries: entries
  }
}

function factory () {
  // 作为原型挂载属性的中间层
  function MPX () {
    this.proto = extend({}, this)
  }

  extend(MPX, APIs)
  extend(MPX.prototype, InstanceAPIs)
  return MPX
}

const EXPORT_MPX = factory()

EXPORT_MPX.config = {
  useStrictDiff: false
}

if (__mpx_mode__ === 'web') {
  window.__mpx = EXPORT_MPX
} else {
  if (global.i18n) {
    EXPORT_MPX.i18n = global.i18n = observable(global.i18n)
  }
}

export default EXPORT_MPX
