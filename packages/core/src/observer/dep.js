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

  depend (info) {
    if (Dep.target) {
      const tracked = Dep.target.addDep(this)
      if (process.env.NODE_ENV !== 'production' && tracked && info) Dep.target.invokeDebuggerHook('onTrack', info)
    }
  }

  notify (info) {
    // stabilize the subscriber list first
    const subs = this.subs.slice()
    for (let i = 0, l = subs.length; i < l; i++) {
      if (process.env.NODE_ENV !== 'production' && info) subs[i].invokeDebuggerHook('onTrigger', info)
      subs[i].update()
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
