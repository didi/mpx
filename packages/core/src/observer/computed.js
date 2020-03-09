import Watcher from './watcher'
import { noop } from '../helper/utils'
import { error } from '../helper/log'
import Dep from './dep'

const sharedPropertyDefinition = {
  enumerable: true,
  configurable: true,
  get: noop,
  set: noop
}

export function initComputed (vm, target, computed) {
  const watchers = vm._computedWatchers = {}
  for (const key in computed) {
    const userDef = computed[key]
    const getter = typeof userDef === 'function' ? userDef : userDef.get
    watchers[key] = new Watcher(vm,
      getter || noop,
      noop,
      { lazy: true }
    )
    if (!(key in target)) {
      defineComputed(vm, target, key, userDef)
    } else {
      error(`The computed key [${key}] is duplicated with data/props, please check.`, vm.options.mpxFileResource)
    }
  }

}

function defineComputed (
  vm,
  target,
  key,
  userDef
) {
  if (typeof userDef === 'function') {
    sharedPropertyDefinition.get = createComputedGetter(vm, key)
    sharedPropertyDefinition.set = noop
  } else {
    sharedPropertyDefinition.get = userDef.get
      ? createComputedGetter(key)
      : noop
    sharedPropertyDefinition.set = userDef.set
      ? userDef.set.bind(vm.target)
      : noop
  }
  Object.defineProperty(target, key, sharedPropertyDefinition)
}


function createComputedGetter (vm, key) {
  return () => {
    const watcher = vm._computedWatchers && vm._computedWatchers[key]
    if (watcher) {
      if (watcher.dirty) {
        watcher.evaluate()
      }
      if (Dep.target) {
        watcher.depend()
      }
      return watcher.value
    }
  }
}
