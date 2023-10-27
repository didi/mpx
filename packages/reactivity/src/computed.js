import { isFunction, noop } from '@mpxjs/utils'
import { ReactiveEffect } from './effect'
import { ReactiveFlags, toRaw } from './reactive'
import { triggerRefValue } from './ref'

export function computed (getterOrOptions) {
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

  console.log(getter, setter)

  return new ComputedRefImpl(getter, setter, onlyGetter || !setter)
}

class ComputedRefImpl {
    _dirty = true
    constructor (getter, setter, isReadonly) {
      this._getter = getter
      this._setter = setter

      this.effect = new ReactiveEffect(getter, () => {
        console.log(787)
        if (!this._dirty) {
          this._dirty = true
          triggerRefValue(this)
        }
      })
      this[ReactiveFlags.IS_READONLY] = isReadonly
    }

    get value () {
      const self = toRaw(this)
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
