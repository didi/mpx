import { isFunction, noop } from '@mpxjs/utils'
import { ReactiveEffect } from './effect'
import { ReactiveFlags, toRaw } from './reactive'
import { triggerRefValue, trackRefValue } from './ref'

export function computed (getterOrOptions, debugOptions) {
  let getter, setter
  const onlyGetter = isFunction(getterOrOptions)
  if (onlyGetter) {
    getter = getterOrOptions
    setter = __DEV__
      ? () => {
          console.warn('Write operation failed: computed value is readonly')
        }
      : noop
  } else {
    getter = getterOrOptions.get
    setter = getterOrOptions.set
  }

  const cRef = new ComputedRefImpl(getter, setter, onlyGetter || !setter)
  if (__DEV__ && debugOptions) {
    cRef.effect.onTrack = debugOptions.onTrack
    cRef.effect.onTrigger = debugOptions.onTrigger
  }
  return cRef
}

class ComputedRefImpl {
    dep = undefined
    _value
    _dirty = true
    __mpx_isRef = true
    constructor (getter, setter, isReadonly) {
      this._getter = getter
      this._setter = setter

      this.effect = new ReactiveEffect(getter, () => {
        if (!this._dirty) {
          this._dirty = true
          triggerRefValue(this)
        }
      })
      this.effect.computed = this
      this[ReactiveFlags.IS_READONLY] = isReadonly
    }

    get value () {
      const self = toRaw(this)
      trackRefValue(self)
      if (self._dirty) {
        self._dirty = false
        self._value = self.effect.run()
      }
      return self._value
    }

    set value (newValue) {
      this._setter(newValue)
    }
}
