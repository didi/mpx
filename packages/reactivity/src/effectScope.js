let activeEffectScope

export class EffectScope {
  active = true;
  effects = [];
  cleanups = []
  /**
   * only assigned by undetached scope
   * @internal
   */
  parent;
  /**
   * record undetached scopes
   * @internal
   */
  scopes;
  /**
   * track a child scope's index in its parent's scopes array for optimized
   * removal
   * @internal
   */
  index;
  // eslint-disable-next-line no-useless-constructor
  constructor (detached = false) {
    this.detached = detached
    this.parent = activeEffectScope
    if (!detached && activeEffectScope) {
      this.index =
        (activeEffectScope.scopes || (activeEffectScope.scopes = [])).push(
          this
        ) - 1
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
    } else if (__DEV__) {
      console.warn('cannot run an inactive effect scope.')
    }
  }

  /**
   * This should only be called on non-detached scopes
   * @internal
   */
  on () {
    activeEffectScope = this
  }

  /**
    * This should only be called on non-detached scopes
    * @internal
   */
  off () {
    activeEffectScope = this.parent
  }

  stop (fromParent) {
    if (this.active) {
      let i, l
      for (i = 0, l = this.effects.length; i < l; i++) {
        this.effects[i].stop()
      }
      if (this.scopes) {
        for (i = 0, l = this.scopes.length; i < l; i++) {
          this.scopes[i].stop(true)
        }
      }
      for (i = 0, l = this.cleanups.length; i < l; i++) {
        this.cleanups[i]()
      }
      // nested scope, should dereference child scope from parent scope after stopping child scope
      if (!this.detached && this.parent && !fromParent) {
        // optimized O(1) removal
        if (this.parent.scopes) {
          const last = this.parent.scopes.pop()
          if (last && last !== this) {
            this.parent.scopes[this.index] = last
            last.index = this.index
          }
        }
      }
      this.parent = undefined
      this.active = false
    }
  }
}

/**
 * Creates an effect scope object which can capture the reactive effects (i.e.
 * computed and watchers) created within it so that these effects can be
 * disposed together.
 *
 * @param detached - Can be used to create a "detached" effect scope.
 */
export function effectScope (detached) {
  return new EffectScope(detached)
}

export function recordEffectScope (effect, scope = activeEffectScope) {
  if (scope && scope.active) {
    scope.effects.push(effect)
  }
}

/**
 * Returns the current active effect scope if there is one.
 */
export function getCurrentScope () {
  return activeEffectScope
}

/**
 * Registers a dispose callback on the current active effect scope. The
 * callback will be invoked when the associated effect scope is stopped.
 *
 * @param fn - The callback function to attach to the scope's cleanup.
 */
export function onScopeDispose (fn) {
  if (activeEffectScope) {
    activeEffectScope.cleanups.push(fn)
  } else if (__DEV__) {
    console.warn(
      'onScopeDispose() is called when there is no active effect scope' +
        ' to be associated with.'
    )
  }
}
