import { queueWatcher, dequeueWatcher } from './scheduler'
import { pushTarget, popTarget } from './dep'
import { getByPath, isObject, remove } from '../helper/utils'
import { getObserver } from './reactive'
import { recordEffectScope } from './effectScope'

let uid = 0

export default class ReactiveEffect {
  constructor (
    fn,
    scheduler,
    scope
  ) {
    this.id = ++uid
    this.fn = fn
    this.scheduler = scheduler
    this.active = true
    this.deps = []
    this.newDeps = []
    this.depIds = new Set()
    this.newDepIds = new Set()
    recordEffectScope(this, scope)
  }

  // run fn and return value
  run () {
    if (!this.active) return this.fn()
    pushTarget(this)
    try {
      return this.fn()
    } finally {
      popTarget()
      this.cleanupDeps()
    }
  }

  // add dependency to this
  addDep (dep) {
    const id = dep.id
    if (!this.newDepIds.has(id)) {
      this.newDepIds.add(id)
      this.newDeps.push(dep)
      if (!this.depIds.has(id)) {
        dep.addSub(this)
      }
    }
  }

  // Clean up for dependency collection.
  cleanupDeps () {
    let i = this.deps.length
    while (i--) {
      const dep = this.deps[i]
      if (!this.newDepIds.has(dep.id)) {
        dep.removeSub(this)
      }
    }
    let tmp = this.depIds
    this.depIds = this.newDepIds
    this.newDepIds = tmp
    this.newDepIds.clear()
    tmp = this.deps
    this.deps = this.newDeps
    this.newDeps = tmp
    this.newDeps.length = 0
  }

  // same as trigger
  update () {
    this.scheduler ? this.scheduler() : this.run()
  }

  // pass through deps for computed
  depend () {
    let i = this.deps.length
    while (i--) {
      this.deps[i].depend()
    }
  }

  // Remove self from all dependencies' subscriber list.
  stop () {
    if (this.active) {
      let i = this.deps.length
      while (i--) {
        this.deps[i].removeSub(this)
      }
      this.active = false
    }
  }
}

/**
 * Recursively traverse an object to evoke all converted
 * getters, so that every nested property inside the object
 * is collected as a "deep" dependency.
 */
const seenObjects = new Set()

function traverse (val) {
  seenObjects.clear()
  _traverse(val, seenObjects)
}

function _traverse (val, seen) {
  let i, keys
  const isA = Array.isArray(val)
  if ((!isA && !isObject(val)) || !Object.isExtensible(val)) {
    return
  }
  const ob = getObserver(val)
  if (ob) {
    const depId = ob.dep.id
    if (seen.has(depId)) {
      return
    }
    seen.add(depId)
  }
  if (isA) {
    i = val.length
    while (i--) _traverse(val[i], seen)
  } else {
    keys = Object.keys(val)
    i = keys.length
    while (i--) _traverse(val[keys[i]], seen)
  }
}
