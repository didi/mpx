declare const RefSymbol: unique symbol
declare const ReactiveSymbol: unique symbol
declare const ComputedRefSymbol: unique symbol
declare const ShallowRefMarker: unique symbol
declare const ShallowReactiveMarker: unique symbol

declare const aaa: 123

export interface Ref<T = any> {
  value: T
  /**
   * Type differentiator only.
   * We need this to be in public d.ts but don't want it to show up in IDE
   * autocomplete, so we use a private Symbol instead.
   */
  [RefSymbol]: true
}

type CollectionTypes = IterableCollections | WeakCollections

type IterableCollections = Map<any, any> | Set<any>
type WeakCollections = WeakMap<any, any> | WeakSet<any>

/**
 * This is a special exported interface for other packages to declare
 * additional types that should bail out for ref unwrapping. For example
 *
 * ``` ts
 * declare module '@mpxjs/core' {
 *   export interface RefUnwrapBailTypes {
 *     runtimeDOMBailTypes: Node | Window
 *   }
 * }
 * ```
 *
 * Note that api-extractor somehow refuses to include `declare module`
 * augmentations in its generated d.ts, so we have to manually append them
 * to the final generated d.ts in our build process.
 */
export interface RefUnwrapBailTypes { }

export type UnwrapRef<T> = T extends ShallowRef<infer V>
  ? V
  : T extends Ref<infer V>
    ? UnwrapRefSimple<V>
    : UnwrapRefSimple<T>

export type UnwrapRefSimple<T> = T extends
  | Function
  | CollectionTypes
  | string | number | boolean
  | Ref
  | RefUnwrapBailTypes[keyof RefUnwrapBailTypes]
    ? T
    : T extends Array<any>
      ? { [K in keyof T]: UnwrapRefSimple<T[K]> }
      : T extends object & { [ShallowReactiveMarker]?: never } // not a shallowReactive
        ? { [P in keyof T]: P extends symbol ? T[P] : UnwrapRef<T[P]> }
        : T

// If the the type T accepts type "any", output type Y, otherwise output type N.
// https://stackoverflow.com/questions/49927523/disallow-call-with-any/49928360#49928360
export type IfAny<T, Y, N> = 0 extends 1 & T ? Y : N
export type ToRef<T> = IfAny<T, Ref<T>, [T] extends [Ref] ? T : Ref<T>>

export type ToRefs<T = any> = {
  [K in keyof T]: ToRef<T[K]>
}

export type CustomRefFactory<T> = (
  track: () => void,
  trigger: () => void
) => {
  get: () => T
  set: (value: T) => void
}

export type ShallowRef<T = any> = Ref<T> & { [ShallowRefMarker]?: true }

export type ShallowReactive<T> = T & { [ShallowReactiveMarker]?: true }

export type UnwrapNestedRefs<T> = T extends Ref ? T : UnwrapRefSimple<T>

export type Reactive<T> = UnwrapNestedRefs<T> & { [ReactiveSymbol]: true }

export interface WritableComputedOptions<T> {
  get: (...args: any[]) => T
  set: (v: T) => void
}

export interface ComputedRef<T = any> extends WritableComputedRef<T> {
  readonly value: T
  [ComputedRefSymbol]: true
}

export interface WritableComputedRef<T> extends Ref<T> {
  // readonly effect: ReactiveEffect<T>
}

type WatchCallback<T> = (
  value: T,
  oldValue: T,
  onCleanup: (cleanupFn: () => void) => void
) => void

type WatchSource<T> =
  | Ref<T> // ref
  | ComputedRef<T>
  | Reactive<T>
  | (() => T) // getter

type MultiWatchSources = (WatchSource<unknown> | object)[]

interface WatchEffectOptions {
  flush?: 'pre' | 'post' | 'sync' // default: 'pre'
}

interface WatchOptions extends WatchEffectOptions {
  immediate?: boolean // 默认：false
  deep?: boolean // 默认：false
  flush?: 'pre' | 'post' | 'sync' // 默认：'pre'
}

interface EffectScope {
  run<T>(fn: () => T): T | undefined // 如果作用域不活跃就为 undefined
  stop(): void
}


export function ref<T extends object>(
  value: T
): [T] extends [Ref] ? T : Ref<UnwrapRef<T>>
export function ref<T>(value: T): Ref<UnwrapRef<T>>
export function ref<T = any>(): Ref<T | undefined>

export function unref<T>(ref: T | Ref<T>): T

export function toRef<T extends object, K extends keyof T>(object: T, key: K): ToRef<T[K]>
export function toRef<T extends object, K extends keyof T>(object: T, key: K, defaultValue: T[K]): ToRef<Exclude<T[K], undefined>>

export function toRefs<T extends object>(object: T): ToRefs<T>

export function isRef<T>(r: Ref<T> | unknown): r is Ref<T>
export function isRef(r: any): r is Ref

export function customRef<T>(factory: CustomRefFactory<T>): Ref<T>

export function shallowRef<T extends object>(value: T): T extends Ref ? T : ShallowRef<T>
export function shallowRef<T>(value: T): ShallowRef<T>
export function shallowRef<T = any>(): ShallowRef<T | undefined>

export function triggerRef(ref: Ref): void

export function reactive<T extends object>(target: T): Reactive<T>

export function isReactive(value: unknown): boolean

/**
 * Return a shallowly-reactive copy of the original object, where only the root
 * level properties are reactive. It also does not auto-unwrap refs (even at the
 * root level).
 */
export function shallowReactive<T extends object>(target: T): ShallowReactive<T>

export function computed<T>(
  getter: (...args: any[]) => T
): ComputedRef<T>
export function computed<T>(
  options: WritableComputedOptions<T>
): WritableComputedRef<T>


export function watchEffect(
  effect: (onCleanup: (cleanupFn: () => void) => void) => void,
  options?: WatchEffectOptions
): () => void

export function watchSyncEffect(
  effect: (onCleanup: (cleanupFn: () => void) => void) => void,
  options?: WatchEffectOptions
): void

export function watchPostEffect(
  effect: (onCleanup: (cleanupFn: () => void) => void) => void,
  options?: WatchEffectOptions
): void

export function watch<T extends MultiWatchSources>(
  sources: [...T],
  callback: WatchCallback<T>,
  options?: WatchOptions
): () => void
export function watch<T extends Readonly<MultiWatchSources>>(
  sources: T,
  callback: WatchCallback<T>,
  options?: WatchOptions
): () => void
export function watch<T>( // for single watcher
  source: WatchSource<T>,
  callback: WatchCallback<T>,
  options?: WatchOptions
): () => void
export function watch<T extends Reactive<object>>( // for reactive value
  source: T,
  callback: WatchCallback<T>,
  options?: WatchOptions
): () => void

export function effectScope(detached?: boolean): EffectScope

export function getCurrentScope(): EffectScope | undefined

export function onScopeDispose(fn: () => void): void

export function set<T extends object>(target: T, key: string | number, value: any): void

export function del<T extends object>(target: T, key: keyof T): void

// nextTick
export function nextTick(fn: () => any): void

// Life Circle
export function onBeforeCreate(callback: () => void): void
export function onCreated(callback: () => void): void
export function onBeforeMount(callback: () => void): void
export function onMounted(callback: () => void): void
export function onUpdated(callback: () => void): void
export function onBeforeUnmount(callback: () => void): void
export function onUnmounted(callback: () => void): void
export function onLoad<T extends object>(callback: (query: T) => void): void
export function onShow(callback: () => void): void
export function onHide(callback: () => void): void
export function onResize(callback: () => void): void

// get instance
export function getCurrentInstance<T extends object>(): { target: T }

