import { isObject } from '../utils'
import debounce from './debounce'

export default function throttle (func, wait, options) {
  let leading = true
  let trailing = true

  if (typeof func !== 'function') {
    throw new TypeError('Excepted a function')
  }

  if (isObject(options)) {
    leading = 'leading' in options ? !!options.leading : leading
    trailing = 'trailing' in options ? !!options.leading : trailing
  }

  return debounce(func, wait, {
    leading,
    trailing,
    'maxWait': wait
  })
}
