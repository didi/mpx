import {
  watch
} from './observer/watch'

import {
  reactive,
  set,
  del
} from './observer/reactive'

import { injectMixins } from './core/injectMixins'
import { diffAndCloneA, makeMap, merge, hasOwn } from './helper/utils'
import { error } from './helper/log'
import Vue from './vue'
import implement from './core/implement'

export {
  createApp,
  createPage,
  createComponent
} from './platform/index'

export {
  createStore,
  createStoreWithThis,
  createStateWithThis,
  createGettersWithThis,
  createMutationsWithThis,
  createActionsWithThis
} from './core/createStore'

export {
  watchEffect,
  watchSyncEffect,
  watchPostEffect,
  watch
} from './observer/watch'

export {
  reactive,
  isReactive,
  shallowReactive,
  markRaw,
  set,
  del
} from './observer/reactive'

export {
  ref,
  unref,
  toRef,
  toRefs,
  isRef,
  customRef,
  shallowRef,
  triggerRef
} from './observer/ref'

export {
  computed
} from './observer/computed'

export {
  effectScope,
  getCurrentScope,
  onScopeDispose
} from './observer/effectScope'

export {
  nextTick
} from './observer/scheduler'

export {
  onBeforeCreate,
  onCreated,
  onBeforeMount,
  onMounted,
  onBeforeUpdate,
  onUpdated,
  onBeforeUnmount,
  onUnmounted,
  onLoad,
  onShow,
  onHide,
  onResize,
  getCurrentInstance
} from './core/proxy'

export { getMixin } from './core/mergeOptions'

export { injectMixins } from './core/injectMixins'

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
    } else if (!hasOwn(target, key)) {
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
  const del = Vue.delete.bind(Vue)
  APIs = {
    injectMixins,
    mixin: injectMixins,
    observable,
    watch,
    use,
    set,
    delete: del,
    implement
  }
} else {
  APIs = {
    injectMixins,
    mixin: injectMixins,
    observable: reactive,
    watch,
    use,
    set,
    delete: del,
    implement
  }

  InstanceAPIs = {
    $set: set,
    $delete: del
  }
}

function factory () {
  // 作为原型挂载属性的中间层
  function MPX () {
  }

  Object.assign(MPX, APIs)
  Object.assign(MPX.prototype, InstanceAPIs)
  // 输出web时在mpx上挂载Vue对象
  if (__mpx_mode__ === 'web') {
    MPX.__vue = Vue
  }
  return MPX
}

const EXPORT_MPX = factory()

EXPORT_MPX.config = {
  useStrictDiff: false,
  ignoreWarning: false,
  ignoreProxyWhiteList: ['id', 'dataset', 'data'],
  observeClassInstance: false,
  errorHandler: null,
  proxyEventHandler: null,
  setDataHandler: null,
  forceFlushSync: false,
  webRouteConfig: {}
}

global.__mpx = EXPORT_MPX

if (__mpx_mode__ !== 'web') {
  if (global.i18n) {
    reactive(global.i18n)
    // 挂载翻译方法
    if (global.i18nMethods) {
      Object.keys(global.i18nMethods).forEach((methodName) => {
        if (/^__/.test(methodName)) return
        global.i18n[methodName] = (...args) => {
          // tap i18n.version
          args.unshift((global.i18n.version, global.i18n.locale))
          return global.i18nMethods[methodName].apply(this, args)
        }
      })

      if (global.i18nMethods.__getMessages) {
        const messages = global.i18nMethods.__getMessages()
        global.i18n.mergeMessages = (newMessages) => {
          merge(messages, newMessages)
          global.i18n.version++
        }
        global.i18n.mergeLocaleMessage = (locale, message) => {
          messages[locale] = messages[locale] || {}
          merge(messages[locale], message)
          global.i18n.version++
        }
      }
    }
    EXPORT_MPX.i18n = global.i18n
  }
}

export default EXPORT_MPX
