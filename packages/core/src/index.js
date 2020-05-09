import * as platform from './platform'
import createStore, { createStoreWithThis } from './core/createStore'
import { injectMixins } from './core/injectMixins'
import { extend, diffAndCloneA, makeMap } from './helper/utils'
import { setConvertRule } from './convertor/convertor'
import { getMixin } from './core/mergeOptions'
import { error } from './helper/log'
import Vue from './vue'
import { observe, set, del as remove } from './observer/index'
import { watch as watchWithVm } from './observer/watch'

export function createApp (config, ...rest) {
  const mpx = new EXPORT_MPX()
  platform.createApp(Object.assign({ proto: mpx.proto }, config), ...rest)
}

export function createPage (config, ...rest) {
  const mpx = new EXPORT_MPX()
  platform.createPage(Object.assign({ proto: mpx.proto }, config), ...rest)
}

export function createComponent (config, ...rest) {
  const mpx = new EXPORT_MPX()
  platform.createComponent(Object.assign({ proto: mpx.proto }, config), ...rest)
}

export { createStore, createStoreWithThis, getMixin }

export function getComputed (computed) {
  // ts computed类型推导辅助函数
  return computed
}

export function toPureObject (obj) {
  return diffAndCloneA(obj).clone
}

function extendProps (target, proxyObj, rawProps, option) {
  const keys = Object.getOwnPropertyNames(proxyObj)
  const rawPropsMap = makeMap(rawProps)

  for (const key of keys) {
    if (APIs[key] || rawPropsMap[key]) {
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

let observable
let watch

if (__mpx_mode__ === 'web') {
  const vm = new Vue()
  observable = Vue.observable.bind(Vue)
  watch = vm.$watch.bind(vm)
  const set = Vue.set.bind(Vue)
  const remove = Vue.delete.bind(Vue)
  // todo 补齐web必要api
  APIs = {
    createApp,
    createPage,
    createComponent,
    createStore,
    createStoreWithThis,
    mixin: injectMixins,
    injectMixins,
    toPureObject,
    observable,
    watch,
    use,
    set,
    remove,
    setConvertRule,
    getMixin,
    getComputed
  }

  InstanceAPIs = {
    $set: set,
    $remove: remove
  }
} else {
  observable = function (obj) {
    observe(obj)
    return obj
  }

  const vm = {}

  watch = function (expOrFn, cb, options) {
    return watchWithVm(vm, expOrFn, cb, options)
  }

  APIs = {
    createApp,
    createPage,
    createComponent,
    createStore,
    createStoreWithThis,
    mixin: injectMixins,
    injectMixins,
    toPureObject,
    observable,
    watch,
    use,
    set,
    remove,
    setConvertRule,
    getMixin,
    getComputed
  }

  InstanceAPIs = {
    $set: set,
    $remove: remove
  }
}

export { watch, observable }

function factory () {
  // 作为原型挂载属性的中间层
  function MPX () {
    this.proto = extend({}, this)
  }

  Object.assign(MPX, APIs)
  Object.assign(MPX.prototype, InstanceAPIs)
  return MPX
}

const EXPORT_MPX = factory()

EXPORT_MPX.config = {
  useStrictDiff: false,
  ignoreRenderError: false
}

if (__mpx_mode__ === 'web') {
  window.__mpx = EXPORT_MPX
} else {
  if (global.i18n) {
    observe(global.i18n)
    // 挂载翻译方法
    if (global.i18nMethods) {
      Object.keys(global.i18nMethods).forEach((methodName) => {
        global.i18n[methodName] = (...args) => {
          args.unshift(global.i18n.locale)
          return global.i18nMethods[methodName].apply(this, args)
        }
      })
    }
    EXPORT_MPX.i18n = global.i18n
  }
}

export default EXPORT_MPX
