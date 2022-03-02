import { isObject, noop } from '../helper/utils'
import { error } from '../helper/log'
import Watcher from './watcher'
import { queueWatcher } from './scheduler'

export function watch (vm, expOrFn, cb, options) {
  if (isObject(cb)) {
    options = cb
    cb = cb.handler
  }
  if (typeof cb === 'string') {
    if (vm.target && vm.target[cb]) {
      cb = vm.target[cb]
    } else {
      cb = noop
    }
  }

  cb = cb || noop

  options = options || {}
  options.user = true
  const watcher = new Watcher(vm, expOrFn, cb, options)
  if (!vm._namedWatchers) vm._namedWatchers = {}
  const name = options.name
  if (name) {
    if (vm._namedWatchers[name]) error(`已存在name=${name} 的 watcher，当存在多个 name 相同 watcher 时仅保留当次创建的 watcher，如需都保留请使用不同的 name！`)
    vm._namedWatchers[name] = watcher
  }
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
