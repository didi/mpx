import {
  reactive
} from './observer/reactive'
import { diffAndCloneA, makeMap, merge, hasOwn } from './helper/utils'
import { error } from './helper/log'
import { Vue, APIs, InstanceAPIs } from './platform/export/index'
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
  // watch
  watchEffect,
  watchSyncEffect,
  watchPostEffect,
  watch,
  // reactive
  reactive,
  isReactive,
  shallowReactive,
  set,
  del,
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
} from './platform/export/index'

export {
  nextTick
} from './observer/scheduler'

export {
  onBeforeCreate,
  onCreated,
  onBeforeMount,
  onMounted,
  onUpdated,
  onBeforeUnmount,
  onUnmounted,
  onLoad,
  onShow,
  onHide,
  onResize
} from './core/proxy'

export { getMixin } from './core/mergeOptions'

export { injectMixins } from './core/injectMixins'

export {
  defineStore,
  getActivePinia,
  setActivePinia,
  mapStores,
  setMapStoreSuffix,
  mapState,
  mapGetters,
  mapActions,
  mapWritableState,
  storeToRefs
} from './pinia'

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

APIs.use = use

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
