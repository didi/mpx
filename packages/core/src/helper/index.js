import { isRef, isReactive } from '@mpxjs/reactivity'
import { noop } from '@mpxjs/utils'

function proxy (target, source, keys, readonly, onConflict) {
  keys = keys || Object.keys(source)
  keys.forEach((key) => {
    const descriptor = {
      get () {
        const val = source[key]
        return !isReactive(source) && isRef(val) ? val.value : val
      },
      configurable: true,
      enumerable: true
    }
    descriptor.set = readonly
      ? noop
      : function (val) {
          // 对reactive对象代理时不需要处理ref解包
          if (!isReactive(source)) {
            const oldVal = source[key]
            if (isRef(oldVal) && !isRef(val)) {
              oldVal.value = val
              return
            }
          }
          source[key] = val
        }
    if (onConflict) {
      if (key in target) {
        if (onConflict(key) === false) return
      }
    }
    Object.defineProperty(target, key, descriptor)
  })
  return target
}

export { proxy }
