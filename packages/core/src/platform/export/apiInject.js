import { callWithErrorHandling, isArray, isFunction, isObject, warn } from '@mpxjs/utils'
import { currentInstance } from '../../core/proxy'

const ProvidesMap = {
  /** 全局 scope */
  __app: Object.create(null),
  /** 页面 scope */
  __pages: Object.create(null)
}

function isNative (Ctor) {
  return typeof Ctor === 'function' && /native code/.test(Ctor.toString())
}
/** @internal */
export const hasSymbol =
  typeof Symbol !== 'undefined' &&
  isNative(Symbol) &&
  typeof Reflect !== 'undefined' &&
  isNative(Reflect.ownKeys)

/** @internal createApp() 初始化应用层 scope provide */
export function initAppProvides (appOptions) {
  const provideOpt = appOptions.provide
  if (provideOpt) {
    const provided = isFunction(provideOpt)
      ? callWithErrorHandling(provideOpt.bind(appOptions), appOptions, 'createApp provide function')
      : provideOpt
    if (isObject(provided)) {
      ProvidesMap.__app = provided
    } else {
      warn('App provides must be an object or a function that returns an object.')
    }
  }
}

function resolvePageId (context) {
  if (context && isFunction(context.getPageId)) {
    return context.getPageId()
  }
}

function resolvePageProvides (context) {
  const pageId = resolvePageId(context)
  return ProvidesMap.__pages[pageId] || (ProvidesMap.__pages[pageId] = Object.create(null))
}

/** @internal */
export function removePageProvides (context) {
  const pageId = resolvePageId(context)
  if (ProvidesMap.__pages[pageId]) {
    delete ProvidesMap.__pages[pageId]
  }
}

export function provide (key, value) {
  const instance = currentInstance
  if (!instance) {
    warn('provide() can only be used inside setup().')
    return
  }
  if (__mpx_mode__ !== 'web' && __mpx_mode__ !== 'ios' && __mpx_mode__ !== 'android') {
    // 小程序无法实现组件父级引用，所以 provide scope 设置为组件所在页面
    const provides = resolvePageProvides(instance.target)
    provides[key] = value
  }
}

export function inject (key, defaultValue, treatDefaultAsFactory = false) {
  const instance = currentInstance
  if (!instance) {
    warn('inject() can only be used inside setup()')
    return
  }
  let provides = Object.create(null)
  const isMiniProgram = __mpx_mode__ !== 'web' && __mpx_mode__ !== 'ios' && __mpx_mode__ !== 'android'
  if (isMiniProgram) {
    provides = resolvePageProvides(instance.target)
  }
  if (key in provides) {
    return provides[key]
  } else if (isMiniProgram && key in ProvidesMap.__app) {
    return ProvidesMap.__app[key]
  } else if (arguments.length > 1) {
    return treatDefaultAsFactory && isFunction(defaultValue)
      ? defaultValue.call(instance && instance.target)
      : defaultValue
  } else {
    warn(`injection "${String(key)}" not found.`)
  }
}

/** @internal */
export function normalizeInject (raw) {
  if (isArray(raw)) {
    const res = {}
    for (let i = 0; i < raw.length; i++) {
      res[raw[i]] = raw[i]
    }
    return res
  }
  return raw
}
