import { remove } from '@mpxjs/utils'

let uid = 0

/**
 * A dep is an observable that can have multiple
 * directives subscribing to it.
 */
export default class Dep {
  constructor (key) {
    this.id = uid++
    this.subs = []
    this.addSubStacks = new Map()
    this.key = key
  }

  addSub (sub) {
    const addSubStack = new Error('此时被添加到订阅者列表').stack
    this.addSubStacks.set(sub, addSubStack)
    this.subs.push(sub)
  }

  removeSub (sub) {
    remove(this.subs, sub)
    this.addSubStacks.delete(sub)
  }

  depend (key, value) {
    if (Dep.target) {
      // if (this.key === 'link_params' || key === 'link_params') console.log(new Error('此时被依赖').stack)
      Dep.target.addDep(this, key, value)
    }
  }

  notify (key, value, oldvalue, stack) {
    // stabilize the subscriber list first
    const subs = this.subs.slice()
    try {
      console.log('[Mpx Dep] notify ' +
        this.subs.length +
        ' subs, from ' +
        key +
        ': ' +
        (typeof oldvalue === 'object' ? JSON.stringify(oldvalue) : oldvalue) +
        ' -> ' +
        (typeof value === 'object' ? JSON.stringify(value) : value) +
        ', subs: ' +
        subs.map(s => `id:${s.id} name:${s.name}`).join(', '))
    } catch (e) {
      // do nothing
    }
    for (let i = 0, l = subs.length; i < l; i++) {
      subs[i].update(key, value, oldvalue, stack, this.addSubStacks.get(subs[i]))
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
