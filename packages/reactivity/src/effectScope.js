let activeEffectScope

export class EffectScope {
  active = true
  effects = []
  constructor (detached) {
    this.detached = detached
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

  stop () {
    if (this.active) {
      let i, l
      for (i = 0, l = this.effects.length; i < l; i++) {
        this.effects[i].stop()
      }

      this.active = false
    }
  }
}

export function effectScope (detached) {
  return new EffectScope(detached)
}

export function recordEffectScope (
  effect,
  scope = activeEffectScope
) {
  if (scope && scope.active) {
    scope.effects.push(effect)
  }
}
