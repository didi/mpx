import Dep, { pushTarget, popTarget } from './dep'
import { recordEffectScope } from './effectScope'
import { PausedState } from '../helper/const'

let uid = 0


export class ReactiveEffect {
  active = true
  deps = []
  newDeps = []
  depIds = new Set()
  newDepIds = new Set()

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
    pushTarget(this)
    try {
      return this.fn()
    } finally {
      popTarget()
      this.deferStop ? this.stop() : this.cleanupDeps()
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
    // avoid dead cycle
    if (Dep.target === this) return
    if (this.pausedState !== PausedState.resumed) {
      this.pausedState = PausedState.dirty
    } else {
      this.scheduler ? this.scheduler() : this.run()
    }
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
    if (Dep.target === this) {
      this.deferStop = true
    } else if (this.active) {
      let i = this.deps.length
      while (i--) {
        this.deps[i].removeSub(this)
      }
      typeof this.onStop === 'function' && this.onStop()
      this.active = false
    }
  }

  pause () {
    this.pausedState = PausedState.paused
  }

  resume () {
    const lastPausedState = this.pausedState
    this.pausedState = PausedState.resumed
    if (lastPausedState === PausedState.dirty) {
      this.scheduler ? this.scheduler() : this.run()
    }
  }
}
