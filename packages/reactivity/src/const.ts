/** @internal key for Ref */
export const RefKey = '__composition_api_ref_key__'
/** @internal key for Observer */
export const ObKey = '__ob__'

/** @internal */
export const enum PausedState {
  Paused,
  Dirty,
  Resumed
}

/**
 * Subscriber common flags
 * @internal
 */
export const enum SubscriberFlags {
  Computed = 1 << 0,
  Effect = 1 << 1,
  Tracking = 1 << 2,
  Recursed = 1 << 4,
  MaybeDirty = 1 << 5,
  Dirty = 1 << 6
}

/**
 * ReactiveEffect only
 * @internal
 */
export const enum EffectFlags {
  RUNNING = 1 << 11,
  ALLOW_RECURSE = 1 << 7,
  PAUSED = 1 << 8,
  NOTIFIED = 1 << 9,
  STOP = 1 << 10
}
