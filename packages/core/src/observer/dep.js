import { remove } from '@mpxjs/utils'

let uid = 0

/**
 * A dep is an observable that can have multiple
 * directives subscribing to it.
 */
export default class Dep {
  constructor () {
    this.id = uid++
    this.subs = []
  }

  addSub (sub) {
    this.subs.push(sub)
  }

  removeSub (sub) {
    remove(this.subs, sub)
  }

  depend (computedRef, triggerRefs) {
    if (Dep.target) {
      Dep.target.addDep(this, computedRef, triggerRefs)
    }
  }

  notify (triggerType, triggerKey, triggerMethod, triggerSource, triggerRef) {
    // stabilize the subscriber list first
    const subs = this.subs.slice()
    let triggerInfo
    for (let i = 0, l = subs.length; i < l; i++) {
      // 调试元数据只在确有订阅者需要时构造，避免性能面板关闭时
      // 每次响应式写入都新增对象分配。
      if (
        triggerInfo === undefined &&
        triggerType &&
        typeof subs[i].onTrigger === 'function'
      ) {
        triggerInfo = { type: triggerType }
        if (triggerSource) triggerInfo.source = triggerSource
        if (triggerKey !== undefined) triggerInfo.key = triggerKey
        if (triggerMethod !== undefined) triggerInfo.method = triggerMethod
        if (triggerRef) triggerInfo.ref = triggerRef
      }
      subs[i].update(triggerInfo, this)
    }
  }
}

// the current target watcher being evaluated.
// this is globally unique because there could be only one
// watcher being evaluated at any time.
Dep.target = null
const targetStack = []

export function pushTarget (_target) {
  if (Dep.target) targetStack.push(Dep.target)
  Dep.target = _target
}

export function popTarget () {
  Dep.target = targetStack.pop()
}
