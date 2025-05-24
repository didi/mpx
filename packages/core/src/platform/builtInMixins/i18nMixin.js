import { effectScope, ref, shallowRef, triggerRef } from '@mpxjs/reactivity'
import { BEFORECREATE } from '../../core/innerLifecycle'
import { DefaultLocale } from '../../helper/const'
import { watch } from '../../observer/watch'
import { getCurrentInstance, onUnmounted } from '../../core/proxy'
import {
  error,
  isPlainObject,
  isNumber,
  mergeObj,
  isEmptyObject
} from '@mpxjs/utils'

let i18n = null

let i18nMethods = null

export function createI18n (options) {
  if (!options) {
    error('CreateI18n() can not be called with null or undefined.')
  }
  i18nMethods = options.methods
  const [globalScope, _global] = createGlobal(options)
  const __instances = new WeakMap()
  i18n = {
    get global () {
      return _global
    },
    get locale () {
      return _global.locale.value || DefaultLocale
    },
    set locale (val) {
      _global.locale.value = val
    },
    get fallbackLocale () {
      return _global.fallbackLocale.value || DefaultLocale
    },
    set fallbackLocale (val) {
      _global.fallbackLocale.value = val
    },
    get t () {
      return _global.t
    },
    get tc () {
      return _global.t
    },
    get te () {
      return _global.te
    },
    get tm () {
      return _global.tm
    },
    dispose () {
      globalScope.stop()
    },
    __instances,
    __getInstance (instance) {
      return __instances.get(instance)
    },
    __setInstance (instance, composer) {
      __instances.set(instance, composer)
    },
    __deleteInstance (instance) {
      __instances.delete(instance)
    }
  }
  return i18n
}

function createGlobal (options) {
  const scope = effectScope()
  const obj = scope.run(() => createComposer(options))
  return [scope, obj]
}

let id = 0

function createComposer (options) {
  if (i18nMethods == null) {
    error('CreateI18n() should be called before useI18n() calling.')
    return
  }
  let { __root, inheritLocale = true, fallbackRoot = true } = options

  const locale = ref(
    __root && inheritLocale
      ? __root.locale.value
      : (options.locale || DefaultLocale)
  )

  const fallbackLocale = ref(
    __root && inheritLocale
      ? __root.fallbackLocale.value
      : (options.fallbackLocale || DefaultLocale)
  )

  const messages = shallowRef(
    isPlainObject(options.messages)
      ? options.messages
      : { [locale]: {} }
  )

  // t && tc
  const t = (...args) => {
    let ret
    if (isNumber(args[1])) {
      // Pluralization
      ret = i18nMethods.tc(messages.value, locale.value, fallbackLocale.value, ...args)
    } else {
      ret = i18nMethods.t(messages.value, locale.value, fallbackLocale.value, ...args)
    }
    if (ret === args[0] && fallbackRoot && __root) {
      ret = __root.t(...args)
    }
    return ret
  }

  // te
  const te = (...args) => i18nMethods.te(messages.value, locale.value, fallbackLocale.value, ...args)

  // tm
  const tm = (...args) => i18nMethods.tm(messages.value, locale.value, fallbackLocale.value, ...args)

  const getLocaleMessage = (locale) => messages.value[locale]

  const setLocaleMessage = (locale, message) => {
    messages.value[locale] = message
    triggerRef(messages)
  }

  const mergeLocaleMessage = (locale, message) => {
    messages.value[locale] = mergeObj(messages.value[locale] || {}, message)
    triggerRef(messages)
  }

  if (__root) {
    watch([__root.locale, __root.fallbackLocale], ([l, fl]) => {
      if (inheritLocale) {
        locale.value = l
        fallbackLocale.value = fl
      }
    })
  }

  return {
    id: id++,
    locale,
    fallbackLocale,
    get messages () {
      return messages
    },
    get isGlobal () {
      return __root === undefined
    },
    get inheritLocale () {
      return inheritLocale
    },
    set inheritLocale (val) {
      inheritLocale = val
      if (val && __root) {
        locale.value = __root.locale.value
        fallbackLocale.value = __root.fallbackLocale.value
      }
    },
    get fallbackRoot () {
      return fallbackRoot
    },
    set fallbackRoot (val) {
      fallbackRoot = val
    },
    t,
    te,
    tm,
    getLocaleMessage,
    setLocaleMessage,
    mergeLocaleMessage
  }
}

function getScope (options) {
  return isEmptyObject(options) ? 'global' : 'local'
}

function setupLifeCycle (instance) {
  onUnmounted(() => {
    i18n.__deleteInstance(instance)
  }, instance)
}

export function useI18n (options) {
  const instance = getCurrentInstance()
  if (instance == null) {
    error('UseI18n() must be called in setup top.')
    return
  }
  const scope = getScope(options)
  const global = i18n.global
  if (scope === 'global') return global

  let composer = i18n.__getInstance(instance)
  if (composer == null) {
    const composerOptions = Object.assign({}, options)
    if (global) composerOptions.__root = global
    composer = createComposer(composerOptions)
    setupLifeCycle(instance)
    i18n.__setInstance(instance, composer)
  }
  return composer
}

export default function i18nMixin () {
  if (i18n) {
    return {
      computed: {
        _l () {
          return i18n.global.locale.value || DefaultLocale
        },
        _fl () {
          return i18n.global.fallbackLocale.value || DefaultLocale
        }
      },
      [BEFORECREATE] () {
        // 挂载$i18n
        this.$i18n = {
          get locale () {
            return i18n.global.locale.value || DefaultLocale
          },
          set locale (val) {
            i18n.global.locale.value = val
          },
          get fallbackLocale () {
            return i18n.global.fallbackLocale.value || DefaultLocale
          },
          set fallbackLocale (val) {
            i18n.global.fallbackLocale.value = val
          }
        }

        // 挂载翻译方法，$t等注入方法只能使用global scope
        Object.keys(i18nMethods).forEach((methodName) => {
          this['$' + methodName] = (...args) => {
            if (methodName === 'tc') methodName = 't'
            return i18n.global[methodName](...args)
          }
        })
      }
    }
  }
}
