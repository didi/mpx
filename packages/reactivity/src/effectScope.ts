import { EffectFlags } from './const'
import { type ReactiveEffect } from './effect'

export let activeEffectScope: EffectScope | undefined

export class EffectScope {
  /**
   * only assigned by undetached scope
   */
  private parent: EffectScope | undefined
  /**
   * record undetached scopes
   */
  private scopes: EffectScope[] | undefined
  /**
   * track a child scope's index in its parent's scopes array for optimized
   * removal
   */
  private index: number | undefined

  flags = 0 as EffectFlags
  effects: ReactiveEffect[] = []
  cleanups: (() => void)[] = []

  constructor(public detached = false) {
    this.parent = activeEffectScope
    if (!detached && activeEffectScope) {
      this.index =
        (activeEffectScope.scopes || (activeEffectScope.scopes = [])).push(
          this
        ) - 1
    }
  }

  get active(): boolean {
    return !(this.flags & EffectFlags.STOP)
  }

  run<T>(fn: () => T): T | undefined {
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

  on(): void {
    activeEffectScope = this
  }

  off(): void {
    activeEffectScope = this.parent
  }

  stop(fromParent?: boolean): void {
    if (this.active) {
      let i, l
      for (i = 0, l = this.effects.length; i < l; i++) {
        this.effects[i].stop()
      }
      this.effects.length = 0
      for (i = 0, l = this.cleanups.length; i < l; i++) {
        this.cleanups[i]()
      }
      this.cleanups.length = 0
      if (this.scopes) {
        for (i = 0, l = this.scopes.length; i < l; i++) {
          this.scopes[i].stop(true)
        }
        this.scopes.length = 0
      }

      // nested scope, dereference from parent to avoid memory leaks
      if (!this.detached && this.parent && !fromParent) {
        // optimized O(1) removal
        const last = this.parent.scopes!.pop()
        if (last && last !== this) {
          this.parent.scopes![this.index!] = last
          last.index = this.index!
        }
      }
      this.parent = undefined
    }
  }

  pause(): void {
    if (!(this.flags & (EffectFlags.PAUSED | EffectFlags.STOP))) {
      this.flags |= EffectFlags.PAUSED
      let i, l
      if (this.scopes) {
        for (i = 0, l = this.scopes.length; i < l; i++) {
          this.scopes[i].pause()
        }
      }
      for (i = 0, l = this.effects.length; i < l; i++) {
        this.effects[i].pause()
      }
    }
  }

  resume(ignoreDirty = false): void {
    if (this.flags & EffectFlags.PAUSED) {
      this.flags &= ~EffectFlags.PAUSED
      let i, l
      if (this.scopes) {
        for (i = 0, l = this.scopes.length; i < l; i++) {
          this.scopes[i].resume(ignoreDirty)
        }
      }
      for (i = 0, l = this.effects.length; i < l; i++) {
        this.effects[i].resume(ignoreDirty)
      }
    }
  }
}

export function effectScope(detached?: boolean): EffectScope {
  return new EffectScope(detached)
}

export function recordEffectScope(
  effect: ReactiveEffect,
  scope = activeEffectScope
): void {
  if (scope && scope.active) {
    scope.effects.push(effect)
  }
}

export function getCurrentScope(): EffectScope | undefined {
  return activeEffectScope
}

export function onScopeDispose(fn: () => void): void {
  if (activeEffectScope) {
    activeEffectScope.cleanups.push(fn)
  }
}
