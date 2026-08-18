import Dep, { pushTarget, popTarget } from './dep'
import { recordEffectScope } from './effectScope'
import { PausedState } from '../helper/const'

let uid = 0

let shouldTrack = true
const trackStack = []

export function pauseTracking () {
  trackStack.push(shouldTrack)
  shouldTrack = false
}

export function resetTracking () {
  const last = trackStack.pop()
  shouldTrack = last === undefined ? true : last
}

export class ReactiveEffect {
  active = true
  deps = []
  newDeps = []
  depIds = new Set()
  newDepIds = new Set()
  allowRecurse = false

  constructor (
    fn,
    scheduler,
    scope
  ) {
    this.id = ++uid
    this.fn = fn
    this.scheduler = scheduler
    this.pausedState = PausedState.resumed
    recordEffectScope(this, scope)
  }

  // run fn and return value
  run () {
    if (!this.active) return this.fn()
    const lastShouldTrack = shouldTrack
    if (this.refTriggerDeps) this.refTriggerValues = new WeakMap()
    try {
      pushTarget(this)
      shouldTrack = true
      return this.fn()
    } finally {
      popTarget()
      shouldTrack = lastShouldTrack
      this.deferStop ? this.stop() : this.cleanupDeps()
    }
  }

  // add dependency to this
  addDep (dep, computedRef, triggerRefs) {
    if (!shouldTrack) return
    this.addRefTriggerDeps(dep, triggerRefs)
    if (computedRef && this.newComputedTriggerRefs) {
      let computedRefs = this.newComputedTriggerRefs.get(dep.id)
      if (!computedRefs) {
        computedRefs = new Set()
        this.newComputedTriggerRefs.set(dep.id, computedRefs)
      }
      computedRefs.add(computedRef)
    }
    const id = dep.id
    if (!this.newDepIds.has(id)) {
      this.newDepIds.add(id)
      this.newDeps.push(dep)
      if (!this.depIds.has(id)) {
        dep.addSub(this)
      }
    }
  }

  addRefTriggerDeps (dep, refs) {
    if (!refs || !this.newRefTriggerDeps) return
    let depRefs = this.newRefTriggerDeps.get(dep.id)
    if (!depRefs) {
      depRefs = new Set()
      this.newRefTriggerDeps.set(dep.id, depRefs)
    }
    refs.forEach(ref => depRefs.add(ref))
  }

  trackRefTriggerValue (value, refs) {
    if (!this.refTriggerValues || !refs || !value || typeof value !== 'object') return
    let valueRefs = this.refTriggerValues.get(value)
    if (!valueRefs) {
      valueRefs = new Set()
      this.refTriggerValues.set(value, valueRefs)
    }
    refs.forEach(ref => valueRefs.add(ref))
  }

  getCurrentRefTriggerRefs (value) {
    return this.refTriggerValues?.get(value)
  }

  trackRefTriggerArray (value, refs) {
    if (!this.refTriggerDeps || !Array.isArray(value) || !refs) return
    for (let i = 0; i < value.length; i++) {
      const item = value[i]
      if (!item || typeof item !== 'object') continue
      this.trackRefTriggerValue(item, refs)
      const observer = item.__ob__
      if (observer?.dep) this.addRefTriggerDeps(observer.dep, refs)
      if (Array.isArray(item)) this.trackRefTriggerArray(item, refs)
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
    if (this.computedTriggerRefs) {
      tmp = this.computedTriggerRefs
      this.computedTriggerRefs = this.newComputedTriggerRefs
      this.newComputedTriggerRefs = tmp
      this.newComputedTriggerRefs.clear()
    }
    if (this.refTriggerDeps) {
      tmp = this.refTriggerDeps
      this.refTriggerDeps = this.newRefTriggerDeps
      this.newRefTriggerDeps = tmp
      this.newRefTriggerDeps.clear()
      this.refTriggerValues = new WeakMap()
    }
  }

  enableComputedTriggerTracking () {
    this.computedTriggerRefs = new Map()
    this.newComputedTriggerRefs = new Map()
    this.refTriggerDeps = new Map()
    this.newRefTriggerDeps = new Map()
    this.refTriggerValues = new WeakMap()
  }

  // same as trigger
  update (triggerInfo, triggerDep) {
    // avoid dead cycle
    if (Dep.target !== this || this.allowRecurse) {
      if (this.pausedState !== PausedState.resumed) {
        this.pausedState = PausedState.dirty
      } else {
        if (typeof this.onTrigger === 'function') {
          const computedTriggerRefs = triggerDep && this.computedTriggerRefs
            ? this.computedTriggerRefs.get(triggerDep.id)
            : undefined
          const refTriggerRefs = triggerDep && this.refTriggerDeps
            ? this.refTriggerDeps.get(triggerDep.id)
            : undefined
          if (computedTriggerRefs || refTriggerRefs) {
            this.onTrigger(triggerInfo, computedTriggerRefs, refTriggerRefs)
          } else {
            this.onTrigger(triggerInfo)
          }
        }
        this.scheduler ? this.scheduler() : this.run()
      }
    }
  }

  // pass through deps for computed
  depend (computedRef) {
    let i = this.deps.length
    while (i--) {
      this.deps[i].depend(computedRef)
    }
  }

  // Remove self from all dependencies' subscriber list.
  stop () {
    if (Dep.target === this) {
      this.deferStop = true
    } else if (this.active) {
      let i = this.deps.length
      while (i--) {
        this.deps[i].removeSub(this)
      }
      typeof this.onStop === 'function' && this.onStop()
      if (this.computedTriggerRefs) {
        this.computedTriggerRefs.clear()
        this.newComputedTriggerRefs.clear()
      }
      if (this.refTriggerDeps) {
        this.refTriggerDeps.clear()
        this.newRefTriggerDeps.clear()
        this.refTriggerValues = new WeakMap()
      }
      this.active = false
    }
  }

  pause () {
    if (this.pausedState !== PausedState.dirty) {
      this.pausedState = PausedState.paused
    }
  }

  resume (ignoreDirty = false) {
    const lastPausedState = this.pausedState
    this.pausedState = PausedState.resumed
    if (!ignoreDirty && lastPausedState === PausedState.dirty) {
      this.scheduler ? this.scheduler() : this.run()
    }
  }
}
