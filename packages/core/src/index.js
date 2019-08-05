import { toJS as toPureObject, extendObservable, observable, set, get, remove, action as createAction } from 'mobx'
import * as platform from './platform'
import createStore, { createStoreWithThis } from './core/createStore'
import { injectMixins } from './core/injectMixins'
import { watch } from './core/watcher'
import { extend } from './helper/utils'
import { setConvertRule } from './convertor/convertor'
import { getMixin } from './core/mergeOptions'

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
      console.error(new Error(`the new property: "${key}" from installing plugin conflicts with already exists，please use prefix/postfix, such as "use('plugin', {prefix: 'mm'})"`))
    }
  }
}

// 安装插件进行扩展API
const installedPlugins = []

function use (plugin, ...rest) {
  if (installedPlugins.indexOf(plugin) > -1) {
    return this
  }
  const option = rest[0]
  const proxyMPX = factory()
  const rawProps = Object.getOwnPropertyNames(proxyMPX)
  const rawPrototypeProps = Object.getOwnPropertyNames(proxyMPX.prototype)
  if (option && (option.prefix || option.postfix)) {
    // 设置前后缀的参数，不需传递给plugin
    rest.shift()
  }
  rest.unshift(proxyMPX)
  if (typeof plugin.install === 'function') {
    plugin.install.apply(plugin, rest)
  } else if (typeof plugin === 'function') {
    plugin.apply(null, rest)
  }
  extendProps(EXPORT_MPX, proxyMPX, rawProps, option)
  extendProps(EXPORT_MPX.prototype, proxyMPX.prototype, rawPrototypeProps, option)
  installedPlugins.push(plugin)
  return this
}

const APIs = {
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
  setConvertRule,
  createAction,
  getMixin,
  getComputed
}

// 实例属性
const InstanceAPIs = {
  $set: set,
  $get: get,
  $remove: remove
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

export default EXPORT_MPX
