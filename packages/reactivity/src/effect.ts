import { EffectFlags, SubscriberFlags } from './const'
import { type EffectScope, recordEffectScope } from './effectScope'
import { type Link, removeLink } from './link'

export type EffectScheduler = (...args: any[]) => any

export interface Subscriber {
  flags: SubscriberFlags | EffectFlags
  deps: Link | undefined
  depsTail: Link | undefined
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
    if (!(this.flags & EffectFlags.PAUSED)) {
      this.scheduler()
    } else {
      this.flags |= EffectFlags.NOTIFIED
    }
  }

  // run fn and return value
  run(): T {
    if (!this.active) {
      // stopped during cleanup
      return this.fn()
    }

    cleanupEffect(this)
    const prevSub = setActiveSub(this)
    startTracking(this)

    try {
      return this.fn()
    } finally {
      setActiveSub(prevSub)
      endTracking(this)
    }
  }

  // Clean up for dependency collection.
  cleanupDeps() {
    // TODO
  }

  // pass through deps for computed
  depend() {
    // TODO
  }

  // Remove self from all dependencies' subscriber list.
  stop() {
    // TODO
  }

  pause(): void {
    if (!(this.flags & EffectFlags.PAUSED)) {
      this.flags |= EffectFlags.PAUSED
    }
  }

  resume(): void {
    const flags = this.flags
    if (flags & EffectFlags.PAUSED) {
      this.flags &= ~EffectFlags.PAUSED
    }
    if (flags & EffectFlags.NOTIFIED) {
      this.flags &= ~EffectFlags.NOTIFIED
      this.notify()
    }
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
