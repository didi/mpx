import { isObject, noop } from '../helper/utils'
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
  if (!vm._userWatchers) {
    vm._userWatchers = [{...watcher}]
  } else {
    vm._userWatchers.push({...watcher})
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
