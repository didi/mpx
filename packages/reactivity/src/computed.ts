import { hasChanged, isFunction, noop } from '@mpxjs/utils'
import { RefFlag, SubscriberFlags } from './const'
import type { Dependency } from './dep'
import {
  type Subscriber,
  activeSub,
  endTracking,
  setActiveSub,
  startTracking
} from './effect'
import type { Ref } from './ref'
import { type Link, addLink } from './link'

declare const ComputedRefSymbol: unique symbol

export interface ComputedRef<T = any> extends WritableComputedRef<T> {
  readonly value: T
  [ComputedRefSymbol]: true
  /**
   * computed should no longer uses effect
   * @deprecated
   */
  effect: ComputedRefImpl
}

export type WritableComputedRef<T, S = T> = Ref<T, S>

export type ComputedGetter<T> = (oldValue?: T) => T
export type ComputedSetter<T> = (newValue: T) => void

export interface WritableComputedOptions<T, S = T> {
  get: ComputedGetter<T>
  set: ComputedSetter<S>
}

export class ComputedRefImpl<T = any> implements Dependency, Subscriber {
  readonly [RefFlag] = true
  private _value: T | undefined = undefined

  // As a Dependency
  subs: Link | undefined = undefined
  subsTail: Link | undefined = undefined

  // As a Subscriber
  deps: Link | undefined = undefined
  depsTail: Link | undefined = undefined
  flags: SubscriberFlags = SubscriberFlags.COMPUTED | SubscriberFlags.DIRTY

  constructor(
    public fn: ComputedGetter<T>,
    private readonly setter: ComputedSetter<T> | undefined
  ) {}

  get value(): T {
    this.refreshComputed()
    if (activeSub) {
      addLink(this, activeSub)
    }
    return this._value as T
  }

  set value(newValue) {
    if (this.setter) {
      this.setter(newValue)
    }
  }

  /**
   * Push Phase - Top-down traversal to notify subscribers
   */
  notify(
    dirtyFlag:
      | SubscriberFlags.MAYBE_DIRTY
      | SubscriberFlags.DIRTY = SubscriberFlags.DIRTY
  ): void {
    if (this.flags & SubscriberFlags.DIRTY) {
      return
    }
    this.flags |= dirtyFlag
    for (let link = this.subs; link; link = link.nextSub) {
      link.sub.notify(SubscriberFlags.MAYBE_DIRTY)
    }
  }

  /**
   * Pull Phase - Bottom-up traversal to check and resolve final dirty state
   */
  refreshComputed(): void {
    if (this.flags & SubscriberFlags.MAYBE_DIRTY) {
      for (let link = this.deps; link !== undefined; link = link.nextDep) {
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
      if (this.update()) {
        this.shallowNotify()
      }
    }
  }

  /**
   * Shallow Push Phase
   */
  private shallowNotify(): void {
    for (let link = this.subs; link; link = link.nextSub) {
      const sub = link.sub
      sub.flags |= SubscriberFlags.DIRTY
    }
  }

  private update(): boolean {
    const prevSub = activeSub
    setActiveSub(this)
    startTracking(this)
    try {
      const oldValue = this._value
      const newValue = this.fn(oldValue)
      if (hasChanged(oldValue, newValue)) {
        this._value = newValue
        return true
      }
      return false
    } finally {
      setActiveSub(prevSub)
      endTracking(this)
    }
  }

  /**
   * for backwards compat
   * It was used in @mpxjs/pinia to differentiate ref from computed.
   */
  get effect(): this {
    return this
  }
}

export function computed<T>(getter: ComputedGetter<T>): ComputedRef<T>
export function computed<T, S = T>(
  options: WritableComputedOptions<T, S>
): WritableComputedRef<T, S>
export function computed<T>(
  getterOrOptions: ComputedGetter<T> | WritableComputedOptions<T>
) {
  let getter: ComputedGetter<T>
  let setter: ComputedSetter<T> | undefined

  if (isFunction(getterOrOptions)) {
    getter = getterOrOptions
    setter = noop
  } else {
    getter = getterOrOptions.get
    setter = getterOrOptions.set
  }

  const cRef = new ComputedRefImpl(getter, setter)
  return cRef as any
}

export function isComputed(val: any): val is ComputedRef {
  return !!(val && val instanceof ComputedRefImpl)
}
