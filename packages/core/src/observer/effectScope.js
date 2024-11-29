let activeEffectScope

class EffectScope {
  active = true
  effects = []
  cleanups = []

  constructor (detached) {
    if (!detached && activeEffectScope) {
      this.parent = activeEffectScope
      this.index = (activeEffectScope.scopes || (activeEffectScope.scopes = [])).push(this) - 1
    }
  }

  run (fn) {
    if (this.active) {
      const currentEffectScope = activeEffectScope
      try {
        activeEffectScope = this
        return fn()
      } finally {
        activeEffectScope = currentEffectScope
      }
    }
  }

  on () {
    activeEffectScope = this
  }

  off () {
    activeEffectScope = this.parent
  }

  stop (fromParent) {
    if (this.active) {
      let i, l
      for (i = 0, l = this.effects.length; i < l; i++) {
        this.effects[i].stop()
      }
      for (i = 0, l = this.cleanups.length; i < l; i++) {
        this.cleanups[i]()
      }
      if (this.scopes) {
        for (i = 0, l = this.scopes.length; i < l; i++) {
          this.scopes[i].stop(true)
        }
      }
      // nested scope, dereference from parent to avoid memory leaks
      if (this.parent && !fromParent) {
        // optimized O(1) removal
        const last = this.parent.scopes.pop()
        if (last && last !== this) {
          this.parent.scopes[this.index] = last
          last.index = this.index
        }
      }
      this.active = false
    }
  }

  pause () {
    if (this.active) {
      let i, l
      for (i = 0, l = this.effects.length; i < l; i++) {
        this.effects[i].pause()
      }
      if (this.scopes) {
        for (i = 0, l = this.scopes.length; i < l; i++) {
          this.scopes[i].pause()
        }
      }
    }
  }

  resume (ignoreDirty = false) {
    if (this.active) {
      let i, l
      for (i = 0, l = this.effects.length; i < l; i++) {
        this.effects[i].resume(ignoreDirty)
      }
      if (this.scopes) {
        for (i = 0, l = this.scopes.length; i < l; i++) {
          this.scopes[i].resume(ignoreDirty)
        }
      }
    }
  }
}

export function effectScope (detached) {
  return new EffectScope(detached)
}

export function recordEffectScope (effect, scope = activeEffectScope) {
  if (scope && scope.active) {
    scope.effects.push(effect)
  }
}

export function getCurrentScope () {
  return activeEffectScope
}

export function onScopeDispose (fn) {
  if (activeEffectScope) {
    activeEffectScope.cleanups.push(fn)
  }
}
