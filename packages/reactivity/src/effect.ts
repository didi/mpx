import { EffectFlags, PausedState, SubscriberFlags } from './const'
// import { recordEffectScope } from './effectScope'
import { Dep } from './dep'
import { Link } from './link'

export type EffectScheduler = (...args: any[]) => any

export interface Subscriber {
  flags: SubscriberFlags | EffectFlags
  deps: Link | undefined
  depsTail: Link | undefined
  notify(): true | void
}

export interface ReactiveEffectOptions {
  scheduler?: EffectScheduler
  allowRecurse?: boolean
  onStop?: () => void
}

export class ReactiveEffect<T = any> implements Subscriber {
  flags: number = SubscriberFlags.Effect
  deps: Link | undefined
  depsTail: Link | undefined

  /** @internal */
  cleanup?: () => void = undefined
  onStop?: () => void

  pausedState: PausedState = PausedState.Resumed

  constructor(
    public fn: () => T,
    public scheduler: EffectScheduler,
    scope?: any // TODO EffectScope
  ) {
    // @ts-expect-error ignore
    recordEffectScope(this, scope) // TODO
  }

  get active(): boolean {
    return !(this.flags & EffectFlags.STOP)
  }

  _notify(
    dirty:
      | SubscriberFlags.MaybeDirty
      | SubscriberFlags.Dirty = SubscriberFlags.Dirty
  ) {
    if (!(this.flags & SubscriberFlags.Dirty)) {
      this.flags &= dirty
      for (let link = this.subs; link !== undefined; link = link.nextSub) {
        // 深层订阅者递归地 push PendingComputed
        link.sub._notify(SubscriberFlags.MaybeDirty)
      }
    }
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
    const prevSub = setCurrentSub(this)
    startTracking(this)

    try {
      return this.fn()
    } finally {
      setCurrentSub(prevSub)
      endTracking(this)
    }
  }

  // add dependency to this
  addDep(dep: Dep) {
    // TODO
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

  pause() {
    if (!(this.flags & EffectFlags.PAUSED)) {
      this.flags |= EffectFlags.PAUSED
    }
  }

  resume() {
    if (this.flags & EffectFlags.PAUSED) {
      this.flags &= ~EffectFlags.PAUSED
    }
  }
}

/** @internal */
function cleanupEffect(e: ReactiveEffect) {
  const { cleanup } = e
  e.cleanup = undefined
  if (cleanup !== undefined) {
    // run cleanup without active effect
    const prevSub = setCurrentSub(undefined)
    try {
      cleanup()
    } finally {
      setCurrentSub(prevSub)
    }
  }
}

function startTracking(sub: Subscriber): void {
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

function endTracking(sub: Subscriber): void {
  const depsTail = sub.depsTail
  let toRemove = depsTail !== undefined ? depsTail.nextDep : sub.deps
  while (toRemove !== undefined) {
    toRemove = unlink(toRemove, sub)
  }
  sub.flags &= ~SubscriberFlags.Tracking
}

function unlink(link: Link, sub = link.sub): Link | undefined {
  const dep = link.dep
  const prevDep = link.prevDep
  const nextDep = link.nextDep
  const nextSub = link.nextSub
  const prevSub = link.prevSub

  if (nextDep !== undefined) {
    nextDep.prevDep = prevDep
  } else {
    sub.depsTail = prevDep
  }

  if (prevDep !== undefined) {
    prevDep.nextDep = nextDep
  } else {
    sub.deps = nextDep
  }

  if (nextSub !== undefined) {
    nextSub.prevSub = prevSub
  } else {
    dep.subsTail = prevSub
  }

  if (prevSub !== undefined) {
    prevSub.nextSub = nextSub
  } else if ((dep.subs = nextSub) === undefined) {
    unwatched(dep)
  }

  return nextDep
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

export function setCurrentSub(sub: Subscriber | undefined) {
  const prevSub = activeSub
  activeSub = sub
  return prevSub
}
