import { callWithErrorHandling, isFunction, isObject, warn } from '@mpxjs/utils'
import { currentInstance } from '../../core/proxy'

const providesMap = {
  /** 全局 scope */
  __app: Object.create(null),
  /** 页面 scope */
  __pages: Object.create(null)
}

/** @internal createApp() 初始化应用层 scope provide */
export function initAppProvides (appOptions) {
  const provideOpt = appOptions.provide
  if (provideOpt) {
    const provided = isFunction(provideOpt)
      ? callWithErrorHandling(provideOpt.bind(appOptions), appOptions, 'createApp provide function')
      : provideOpt
    if (isObject(provided)) {
      providesMap.__app = provided
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
  return providesMap.__pages[pageId] || (providesMap.__pages[pageId] = Object.create(null))
}

/** @internal */
export function removePageProvides (context) {
  const pageId = resolvePageId(context)
  if (providesMap.__pages[pageId]) {
    delete providesMap.__pages[pageId]
  }
}

export function provide (key, value) {
  const instance = currentInstance
  if (!instance) {
    warn('provide() can only be used inside setup().')
    return
  }
  // 小程序无法实现组件父级引用，所以 provide scope 设置为组件所在页面
  const provides = resolvePageProvides(instance.target)
  provides[key] = value
}

export function inject (key, defaultValue, treatDefaultAsFactory = false) {
  const instance = currentInstance
  if (!instance) {
    warn('inject() can only be used inside setup()')
    return
  }
  const provides = resolvePageProvides(instance.target)
  if (key in provides) {
    return provides[key]
  } else if (key in providesMap.__app) {
    return providesMap.__app[key]
  } else if (arguments.length > 1) {
    return treatDefaultAsFactory && isFunction(defaultValue)
      ? defaultValue.call(instance && instance.target)
      : defaultValue
  } else {
    warn(`injection "${String(key)}" not found.`)
  }
}
