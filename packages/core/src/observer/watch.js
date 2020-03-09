import { isPlainObject } from '../helper/utils'
import Watcher from './watcher'
import { queueWatcher } from './scheduler'

export function watch (vm, expOrFn, cb, options) {
  if (isPlainObject(cb)) {
    options = cb
    cb = cb.handler
  }
  if (typeof cb === 'string') {
    cb = vm.target[cb]
  }

  options = options || {}
  options.user = true
  const watcher = new Watcher(vm, expOrFn, cb, options)
  if (options.immediate) {
    cb.call(vm.target, watcher.value)
  } else if (options.immediateAsync) {
    watcher.immediateAsync = true
    queueWatcher(watcher)
  }

  return function unwatchFn () {
    watcher.teardown()
  }
}
