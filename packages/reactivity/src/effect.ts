import { extend, isFunction, warn } from '@mpxjs/utils'
import { EffectFlags, SubscriberFlags } from './const'
import { ComputedRefImpl } from './computed'
import { Dependency } from './dep'
import { type EffectScope, recordEffectScope } from './effectScope'
import { type Link, removeLink } from './link'

export type EffectScheduler = (...args: any[]) => any

export interface Subscriber {
  /** head node of its Deps list */
  deps: Link | undefined
  /** tail node of its Deps list */
  depsTail: Link | undefined
  flags: SubscriberFlags | EffectFlags
  notify(dirtyFlag?: SubscriberFlags.MAYBE_DIRTY | SubscriberFlags.DIRTY): void
}

export interface ReactiveEffectOptions {
  scheduler?: EffectScheduler
  onStop?: () => void
  allowRecurse?: boolean
}

export class ReactiveEffect<T = any>
  implements Subscriber, ReactiveEffectOptions
{
  deps: Link | undefined
  depsTail: Link | undefined
  flags: SubscriberFlags = SubscriberFlags.EFFECT
  onStop?: () => void

  constructor(
    public fn: () => T,
    public scheduler?: EffectScheduler,
    scope?: EffectScope
  ) {
    recordEffectScope(this, scope)
  }

  get active(): boolean {
    return !(this.flags & EffectFlags.STOP)
  }

  notify(dirtyFlag: SubscriberFlags.MAYBE_DIRTY | SubscriberFlags.DIRTY): void {
    this.flags |= dirtyFlag
    addToEffectBuffer(this)
  }

  trigger(): void {
    if (activeSub === this && !this.allowRecurse) {
      // cycle detection
      return
    }
    if (this.flags & EffectFlags.PAUSED) {
      this.flags |= EffectFlags.NOTIFIED
    } else {
      if (isFunction(this.scheduler)) {
        this.scheduler()
      } else {
        if (this.dirty) {
          this.run()
        }
      }
    }
  }

  run(): T {
    if (!this.active) {
      return this.fn()
    }
    const prevSub = setActiveSub(this)
    startTracking(this)
    try {
      return this.fn()
    } finally {
      if (activeSub !== this) {
        warn('Active effect was not restored correctly after run.')
      }
      setActiveSub(prevSub)
      endTracking(this)
      if (this.flags & EffectFlags.DEFERRED_STOP) {
        this.stop()
      }
    }
  }

  stop(): void {
    if (activeSub === this) {
      this.flags |= EffectFlags.DEFERRED_STOP
    } else if (this.active) {
      startTracking(this)
      endTracking(this)
      if (isFunction(this.onStop)) {
        this.onStop()
      }
      this.flags |= EffectFlags.STOP
    }
  }

  pause(): void {
    this.flags |= EffectFlags.PAUSED
  }

  resume(ignoreDirty = false): void {
    const flags = this.flags
    if (flags & EffectFlags.PAUSED) {
      this.flags &= ~EffectFlags.PAUSED
    }
    if (!ignoreDirty && flags & EffectFlags.NOTIFIED) {
      this.flags &= ~EffectFlags.NOTIFIED
      this.trigger()
    }
  }

  private get dirty(): boolean {
    if (this.flags & SubscriberFlags.MAYBE_DIRTY) {
      for (let link = this.deps; link; link = link.nextDep) {
        const dep = link.dep as Dependency | ComputedRefImpl
        if ('flags' in dep) {
          dep.refreshComputed()
        }
        if (this.flags & SubscriberFlags.DIRTY) {
          break
        }
      }
      this.flags &= ~SubscriberFlags.MAYBE_DIRTY
    }
    if (this.flags & SubscriberFlags.DIRTY) {
      return true
    }
    return false
  }

  get allowRecurse(): boolean {
    return !!(this.flags & EffectFlags.ALLOW_RECURSE)
  }

  set allowRecurse(value: boolean) {
    if (value) {
      this.flags |= EffectFlags.ALLOW_RECURSE
    } else {
      this.flags &= ~EffectFlags.ALLOW_RECURSE
    }
  }
}

/** @internal */
export function startTracking(sub: Subscriber): void {
  sub.depsTail = undefined
  sub.flags =
    (sub.flags & ~(SubscriberFlags.MAYBE_DIRTY | SubscriberFlags.DIRTY)) |
    SubscriberFlags.TRACKING
}

/** @internal */
export function endTracking(sub: Subscriber): void {
  const depsTail = sub.depsTail
  let toRemove = depsTail ? depsTail.nextDep : sub.deps
  while (toRemove) {
    toRemove = removeLink(toRemove, sub)
  }
  sub.flags &= ~SubscriberFlags.TRACKING
}

/** @internal */
const trackStack: (Subscriber | undefined)[] = []

export function pauseTracking(): void {
  trackStack.push(activeSub)
  activeSub = undefined
}

export function resetTracking(): void {
  activeSub = trackStack.pop()
}

export let activeSub: Subscriber | undefined

/** @internal */
export function setActiveSub(sub: Subscriber | undefined) {
  const prevSub = activeSub
  activeSub = sub
  return prevSub
}

// #region effect batch
const notifiedEffectBuffer: (ReactiveEffect | undefined)[] = []
let batchDepth = 0
let notifyIndex = 0
let notifyBufferLength = 0

/** @internal */
export function startBatch(): void {
  ++batchDepth
}

/** @internal */
export function endBatch(): void {
  if (!--batchDepth) {
    processEffectNotifications()
  }
}

/** @internal */
export function processEffectNotifications(): void {
  if (!notifyBufferLength) {
    return
  }
  while (notifyIndex < notifyBufferLength) {
    const effect = notifiedEffectBuffer[notifyIndex]!
    notifiedEffectBuffer[notifyIndex++] = undefined
    effect.trigger()
  }
  notifyIndex = 0
  notifyBufferLength = 0
}

/** @internal */
export function addToEffectBuffer(effect: ReactiveEffect): void {
  notifiedEffectBuffer[notifyBufferLength++] = effect
}
// #endregion

// #region effect API test
/**
 * Since we did not expose `effect` in Mpx,
 * it is used only for internal testing.
 * @internal
 */
export function effect<T = any>(
  fn: () => T,
  options?: ReactiveEffectOptions
): void {
  const e = new ReactiveEffect(fn)
  if (options) {
    extend(e, options)
  }
  try {
    e.run()
  } catch (err) {
    e.stop()
    throw err
  }
}
// #endregion
