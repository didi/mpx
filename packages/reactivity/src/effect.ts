import { warn } from '@mpxjs/utils'
import { EffectFlags, SubscriberFlags } from './const'
import { ComputedRefImpl } from './computed'
import { Dependency } from './dep'
import { type EffectScope, recordEffectScope } from './effectScope'
import { type Link, removeLink } from './link'

export type EffectScheduler = (...args: any[]) => any

export interface Subscriber {
  deps: Link | undefined
  depsTail: Link | undefined
  flags: SubscriberFlags | EffectFlags
  notify(
    dirtyFlag?: SubscriberFlags.MaybeDirty | SubscriberFlags.Dirty
  ): true | void
}

export interface ReactiveEffectOptions {
  scheduler?: EffectScheduler
  allowRecurse?: boolean
  onStop?: () => void
}

export class ReactiveEffect<T = any> implements Subscriber {
  // for backwards compat
  private deferStop = false

  deps: Link | undefined
  depsTail: Link | undefined
  flags: SubscriberFlags = SubscriberFlags.Effect

  /** @internal */
  cleanup?: () => void = undefined
  onStop?: () => void

  constructor(
    public fn: () => T,
    public scheduler: EffectScheduler,
    scope?: EffectScope
  ) {
    recordEffectScope(this, scope)
  }

  get active(): boolean {
    return !(this.flags & EffectFlags.STOP)
  }

  notify(): void {
    // TODO cycle detection

    if (!(this.flags & EffectFlags.PAUSED)) {
      if (this.scheduler) {
        this.scheduler()
      } else {
        if (this.dirty) {
          this.run()
        }
      }
    } else {
      this.flags |= EffectFlags.NOTIFIED
    }
  }

  run(): T {
    if (!this.active) {
      return this.fn()
    }

    // TODO flag
    this.flags |= EffectFlags.RUNNING
    cleanupEffect(this)
    const prevSub = setActiveSub(this)
    startTracking(this)

    try {
      return this.fn()
    } finally {
      if (activeSub !== this) {
        warn('Active effect was not restored correctly.')
      }
      setActiveSub(prevSub)
      endTracking(this)
      this.deferStop ? this.stop() : cleanupEffect(this)
      // TODO flag
      this.flags &= ~EffectFlags.RUNNING
    }
  }

  stop(): void {
    if (activeSub === this) {
      this.deferStop = true
    } else if (this.active) {
      startTracking(this)
      endTracking(this)
      cleanupEffect(this)
      this.onStop && this.onStop()
      this.flags |= EffectFlags.STOP
    }
  }

  pause(): void {
    this.flags |= EffectFlags.PAUSED
  }

  resume(): void {
    const flags = this.flags
    if (flags & EffectFlags.PAUSED) {
      this.flags &= ~EffectFlags.PAUSED
    }
    // TODO flags
    if (flags & EffectFlags.NOTIFIED) {
      this.flags &= ~EffectFlags.NOTIFIED
      this.notify()
    }
  }

  get dirty(): boolean {
    if (this.flags & SubscriberFlags.MaybeDirty) {
      for (let link = this.deps; link; link = link.nextDep) {
        const dep = link.dep as Dependency | ComputedRefImpl
        if ('flags' in dep) {
          dep.refreshComputed()
        }
      }
    }
    if (this.flags & SubscriberFlags.Dirty) {
      return true
    }
    return false
  }
}

function cleanupEffect(e: ReactiveEffect) {
  const { cleanup } = e
  e.cleanup = undefined
  if (cleanup !== undefined) {
    // run cleanup without active effect
    const prevSub = setActiveSub(undefined)
    try {
      cleanup()
    } finally {
      setActiveSub(prevSub)
    }
  }
}

/** @internal */
export function startTracking(sub: Subscriber): void {
  sub.depsTail = undefined
  sub.flags =
    (sub.flags &
      ~(
        SubscriberFlags.Recursed |
        SubscriberFlags.MaybeDirty |
        SubscriberFlags.Dirty
      )) |
    SubscriberFlags.Tracking
}

/** @internal */
export function endTracking(sub: Subscriber): void {
  const depsTail = sub.depsTail
  let toRemove = depsTail ? depsTail.nextDep : sub.deps
  while (toRemove !== undefined) {
    toRemove = removeLink(toRemove, sub)
  }
  sub.flags &= ~SubscriberFlags.Tracking
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
