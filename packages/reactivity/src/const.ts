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
  COMPUTED = 1 << 0,
  EFFECT = 1 << 1,
  TRACKING = 1 << 2,
  MAYBE_DIRTY = 1 << 3,
  DIRTY = 1 << 4
}

/**
 * ReactiveEffect only
 * @internal
 */
export const enum EffectFlags {
  ALLOW_RECURSE = 1 << 5,
  PAUSED = 1 << 6,
  NOTIFIED = 1 << 7,
  STOP = 1 << 8,
  DEFERRED_STOP = 1 << 9
}
