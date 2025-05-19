import { extend, hasOwn, isPlainObject, warn } from '@mpxjs/utils'
import {
  type ShallowReactiveMarker,
  isReactive,
  reactive,
  set,
  shallowReactive
} from './reactive'
import { RefKey } from './const'

declare const RefSymbol: unique symbol
export interface Ref<T = any, S = T> {
  get value(): T
  set value(_: S)
  /**
   * Type differentiator only.
   * We need this to be in public d.ts but don't want it to show up in IDE
   * autocomplete, so we use a private Symbol instead.
   */
  [RefSymbol]: true
}

export class RefImpl {
  constructor(options: PropertyDescriptor) {
    Object.defineProperty(this, 'value', extend({ enumerable: true }, options))
  }
}

export function createRef(options: PropertyDescriptor, effect?: any) {
  const ref = new RefImpl(options)
  if (effect) {
    // @ts-expect-error todo
    // TODO type
    ref.effect = effect
    effect.computed = ref
  }
  return Object.seal(ref)
}

export function isRef<T>(r: Ref<T> | unknown): r is Ref<T>
export function isRef(val: any): val is Ref {
  return val instanceof RefImpl
}

// #region ref
export function ref<T extends Ref>(value: T): T
export function ref<T>(value: T): Ref<UnwrapRef<T>>
export function ref<T = any>(): Ref<T | undefined>

export function ref(raw?: unknown) {
  if (isRef(raw)) return raw
  const wrapper = reactive({ [RefKey]: raw })
  return createRef({
    get: () => wrapper[RefKey],
    set: (val: any) => {
      wrapper[RefKey] = val
    }
  })
}
// #endregion

export function unref<T>(ref: T | Ref<T>): T {
  return isRef(ref) ? (ref.value as any) : ref
}

// #region toRef
export type IfAny<T, Y, N> = 0 extends 1 & T ? Y : N
export type ToRef<T> = IfAny<T, Ref<T>, [T] extends [Ref] ? T : Ref<T>>

export function toRef<T extends object, K extends keyof T>(
  object: T,
  key: K
): ToRef<T[K]>
export function toRef<T extends object, K extends keyof T>(
  object: T,
  key: K,
  defaultValue: T[K]
): ToRef<Exclude<T[K], undefined>>

export function toRef<T extends object, K extends keyof T>(
  obj: T,
  key: K,
  defaultValue?: T[K]
) {
  if (!isReactive(obj)) {
    warn('toRef() expects a reactive object but received a plain one.')
  }
  if (!hasOwn(obj, key as any)) set(obj, key as any, defaultValue)
  const val = obj[key]
  if (isRef(val)) return val
  return createRef({
    get: () => obj[key],
    set: (val: T[K]) => {
      obj[key] = val
    }
  })
}
// #endregion

// #region toRefs
export type ToRefs<T = any> = {
  [K in keyof T]: ToRef<T[K]>
}

export function toRefs<T extends object>(obj: T): ToRefs<T> {
  if (!isReactive(obj)) {
    warn('toRefs() expects a reactive object but received a plain one.')
  }
  if (!isPlainObject(obj)) return obj as ToRefs<T>
  const result = {} as ToRefs<T>
  Object.keys(obj).forEach(key => {
    result[key as keyof T] = toRef(obj, key as keyof T)
  })
  return result
}
// #endregion

export function customRef(factory: Function) {
  const version = ref(0)
  return createRef(
    factory(
      // track
      () => version.value,
      // trigger
      () => {
        version.value++
      }
    )
  )
}

// #region shallowRef
declare const ShallowRefMarker: unique symbol
export type ShallowRef<T = any> = Ref<T> & { [ShallowRefMarker]?: true }

export function shallowRef<T>(value: T | Ref<T>): Ref<T> | ShallowRef<T>
export function shallowRef<T extends Ref>(value: T): T
export function shallowRef<T>(value: T): ShallowRef<T>
export function shallowRef<T = any>(): ShallowRef<T | undefined>

export function shallowRef(raw?: unknown) {
  if (isRef(raw)) return raw
  const wrapper = shallowReactive({ [RefKey]: raw })
  return createRef({
    get: () => wrapper[RefKey],
    set: (val: any) => {
      wrapper[RefKey] = val
    }
  })
}
// #endregion

export function triggerRef(ref: Ref): void {
  // if (!isRef(ref)) {
  //   return
  // }
  // noop
}

// #region other internal types
export type UnwrapRef<T> =
  T extends ShallowRef<infer V>
    ? V
    : T extends Ref<infer V>
      ? UnwrapRefSimple<V>
      : UnwrapRefSimple<T>

export interface RefUnwrapBailTypes {}

type IterableCollections = Map<any, any> | Set<any>
type WeakCollections = WeakMap<any, any> | WeakSet<any>
type CollectionTypes = IterableCollections | WeakCollections

export type UnwrapRefSimple<T> = T extends
  | Function
  | CollectionTypes
  | string
  | number
  | boolean
  | Ref
  | RefUnwrapBailTypes[keyof RefUnwrapBailTypes]
  ? T
  : T extends Array<any>
    ? { [K in keyof T]: UnwrapRefSimple<T[K]> }
    : T extends object & { [ShallowReactiveMarker]?: never } // not a shallowReactive
      ? { [P in keyof T]: P extends symbol ? T[P] : UnwrapRef<T[P]> }
      : T
// #endregion
