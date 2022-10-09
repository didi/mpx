// Type definitions for @mpxjs/core
// Project: https://github.com/didi/mpx
// Definitions by: hiyuki <https://github.com/hiyuki>
// TypeScript Version: 4.1.3

/// <reference types="miniprogram-api-typings" />
/// <reference path="./global.d.ts" />
/// <reference path="./node.d.ts" />

// @ts-ignore
import VueI18n from 'vue-i18n'

import type { GetComputedType } from '@mpxjs/store'

export * from '@mpxjs/store'

declare module 'vue-i18n' {
  export default interface VueI18n {
    mergeMessages (messages: { [index: string]: VueI18n.LocaleMessageObject }): void;
  }
}

// utils
type ObjectOf<T> = {
  [key: string]: T
}

type AnyObject = ObjectOf<any>

type UnionToIntersection<U> = (U extends any
  ? (k: U) => void
  : never) extends ((k: infer I) => void)
  ? I
  : never;

type ArrayType<T extends any[]> = T extends Array<infer R> ? R : never;

// Mpx types
type Data = object | (() => object)

type PropType = StringConstructor | NumberConstructor | BooleanConstructor | ObjectConstructor | ArrayConstructor | null

interface PropOpt {
  type: PropType
  optionalTypes?: Array<PropType>
  value?: any

  observer? (value: any, old: any, changedPath: string): void
}

interface Properties {
  [key: string]: PropType | PropOpt
}

interface Methods {
  [key: string]: (...args: any[]) => any
}

interface WatchOpt {
  immediate?: boolean
  immediateAsync?: boolean
  deep?: boolean
  sync?: boolean
  once?: boolean | ((newVal: any, oldVal: any) => boolean)
}

interface WatchOptWithHandler extends WatchOpt {
  handler?: WatchHandler
}

interface WatchHandler {
  (val: any, oldVal?: any): void
}

interface WatchField {
  [key: string]: WatchHandler | WatchOptWithHandler
}

interface ObserversDefs {
  [expression: string]: (...fields: any[]) => any
}

type GetDataType<T> = T extends () => any ? ReturnType<T> : T

type PropValueType<Def> = Def extends {
    type: (...args: any[]) => infer T;
    optionalType?: ((...args: any[]) => infer T)[];
    value?: infer T;
  }
  ? T
  : Def extends (...args: any[]) => infer T
    ? T
    : any;

type GetPropsType<T> = {
  readonly [K in keyof T]: PropValueType<T[K]>
}

type RequiredPropertyNames<T> = {
  [K in keyof T]-?: T[K] extends undefined ? never : K
}[keyof T];

type RequiredPropertiesForUnion<T> = T extends object ? Pick<T, RequiredPropertyNames<T>> : never

interface Mixin<D, P, C, M> {
  data?: D
  properties?: P
  computed?: C
  methods?: M

  [index: string]: any
}

type UnboxMixinField<T extends Mixin<{}, {}, {}, {}>, F> = F extends keyof T ? T[F] : {}

type UnboxMixinsField<Mi extends Array<any>, F> =
  UnionToIntersection<RequiredPropertiesForUnion<UnboxMixinField<ArrayType<Mi>, F>>>

interface Context {
  triggerEvent: WechatMiniprogram.Component.InstanceMethods<Record<string, any>>['triggerEvent']
  refs: ObjectOf<WechatMiniprogram.NodesRef & ComponentIns<{}, {}, {}, {}, []>>

  forceUpdate (params?: object, callback?: () => void): void

  selectComponent: ReplaceWxComponentIns['selectComponent']
  selectAllComponents: ReplaceWxComponentIns['selectAllComponents']
  createSelectorQuery: WechatMiniprogram.Component.InstanceMethods<Record<string, any>>['createSelectorQuery']
  createIntersectionObserver: WechatMiniprogram.Component.InstanceMethods<Record<string, any>>['createIntersectionObserver']
}

interface ComponentOpt<D, P, C, M, Mi extends Array<any>, S extends Record<any, any>> extends Partial<WechatMiniprogram.Component.Lifetimes> {
  data?: D
  properties?: P
  computed?: C
  methods?: M
  mixins?: Mi
  watch?: WatchField
  observers?: ObserversDefs
  options?: Partial<{
    addGlobalClass: boolean
    multipleSlots: boolean
    styleIsolation: string
  }>

  setup?: (props: GetPropsType<P & UnboxMixinsField<Mi, 'properties'>>, context: Context) => S

  pageShow?: () => void

  pageHide?: () => void

  externalClasses?: string[]

  lifetimes?: Partial<WechatMiniprogram.Component.Lifetimes>

  pageLifetimes?: Partial<WechatMiniprogram.Component.PageLifetimes>

  relations?: { [key: string]: WechatMiniprogram.Component.RelationOption }

  [index: string]: any
}

type PageOpt<D, P, C, M, Mi extends Array<any>, S extends Record<any, any>> =
  ComponentOpt<D, P, C, M, Mi, S>
  & Partial<WechatMiniprogram.Page.ILifetime>

type ThisTypedPageOpt<D extends AnyObject, P, C, M, Mi extends Array<any>, S extends Record<any, any>, O = {}> =
  PageOpt<D, P, C, M, Mi, S>
  & ThisType<ComponentIns<D, P, C, M, Mi, S, O>> & O

type ThisTypedComponentOpt<D extends AnyObject, P, C, M, Mi extends Array<any>, S extends Record<any, any>, O = {}> =
  ComponentOpt<D, P, C, M, Mi, S>
  & ThisType<ComponentIns<D, P, C, M, Mi, S, O>> & O

type I18nValues = {
  [k: string]: string
} | Array<string>

declare function get (obj: object, key: string): any

// declare function set (obj: object, key: string, value: any): any

// declare function del (obj: object, key: string): any

declare function t (key: string, values?: I18nValues): string

declare function tc (key: string, choice: number, values?: I18nValues): string

declare function te (key: string): boolean

declare function tm (key: string): any

export function observable<T extends object> (obj: T): T

type MpxComProps<O> = { $rawOptions: O }

export interface MpxComponentIns {

  $refs: ObjectOf<WechatMiniprogram.NodesRef & ComponentIns<{}, {}, {}, {}, []>>

  $set: typeof set

  $remove: typeof del

  $delete: typeof del

  $watch (expr: string | (() => any), handler: WatchHandler | WatchOptWithHandler, options?: WatchOpt): () => void

  $forceUpdate (params?: object, callback?: () => void): void

  $nextTick (fn: () => void): void

  $t: typeof t

  $tc: typeof tc

  $te: typeof te

  $tm: typeof tm

  [k: string]: any
}

interface ReplaceWxComponentIns {
  selectComponent (selector: string): ComponentIns<{}, {}, {}, {}, []>

  selectAllComponents (selector: string): Array<ComponentIns<{}, {}, {}, {}, []>>
}

type WxComponentIns<D extends AnyObject> =
  ReplaceWxComponentIns
  & WechatMiniprogram.Component.InstanceProperties
  & WechatMiniprogram.Component.InstanceMethods<D>

type ComponentIns<D extends AnyObject, P, C, M, Mi extends Array<any>, S extends Record<any, any> = {}, O = {}> =
  GetDataType<D> & UnboxMixinsField<Mi, 'data'> &
  M & UnboxMixinsField<Mi, 'methods'> & { [K in keyof S]: S[K] extends Ref<infer V> ? V : S[K] } &
  GetPropsType<P & UnboxMixinsField<Mi, 'properties'>> &
  GetComputedType<C & UnboxMixinsField<Mi, 'computed'>> &
  WxComponentIns<D> & MpxComponentIns & MpxComProps<O>

interface CreateConfig {
  customCtor: any
}

export function createComponent<D extends Data = {}, P extends Properties = {}, C = {}, M extends Methods = {}, Mi extends Array<any> = [], S extends AnyObject = {}, O extends AnyObject = {}> (opt: ThisTypedComponentOpt<D, P, C, M, Mi, S, O>, config?: CreateConfig): void

export function getMixin<D extends Data = {}, P extends Properties = {}, C = {}, M extends Methods = {}, Mi extends Array<any> = [], S extends AnyObject = {}, O extends AnyObject = {}> (opt: ThisTypedComponentOpt<D, P, C, M, Mi, S, O>): {
  data: GetDataType<D> & UnboxMixinsField<Mi, 'data'>
  properties: P & UnboxMixinsField<Mi, 'properties'>
  computed: C & UnboxMixinsField<Mi, 'computed'>
  methods: M & UnboxMixinsField<Mi, 'methods'>
  [index: string]: any
}

export function createPage<D extends Data = {}, P extends Properties = {}, C = {}, M extends Methods = {}, Mi extends Array<any> = [], O extends AnyObject = {}> (opt: ThisTypedPageOpt<D, P, C, M, Mi, O>, config?: CreateConfig): void

export function createApp<T extends WechatMiniprogram.IAnyObject> (opt: WechatMiniprogram.App.Options<T>, config?: CreateConfig): void

type MixinType = 'app' | 'page' | 'component'

export function injectMixins (mixins: object | Array<object>, options?: MixinType | MixinType[] | { types?: MixinType | MixinType[], stage?: number }): void

// export function watch (expr: string | (() => any), handler: WatchHandler | WatchOptWithHandler, options?: WatchOpt): () => void

interface AnyConstructor {
  new (...args: any[]): any

  prototype: any
}

interface MpxConfig {
  useStrictDiff: boolean
  ignoreWarning: boolean | string | RegExp | ((msg: string, location: string, e: Error) => boolean)
  ignoreProxyWhiteList: Array<string>
  observeClassInstance: boolean | Array<AnyConstructor>
  errorHandler: (e: Error, target: ComponentIns<{}, {}, {}, {}, []>, hookName: string) => any | null
  proxyEventHandler: (e: Event) => any | null
  setDataHandler: (data: object, target: ComponentIns<{}, {}, {}, {}, []>) => any | null
  forceFlushSync: boolean,
  webRouteConfig: object
}

type SupportedMode = 'wx' | 'ali' | 'qq' | 'swan' | 'tt' | 'web' | 'qa'

interface ImplementOptions {
  modes?: Array<SupportedMode>
  processor?: () => any
  remove?: boolean
}

export function toPureObject<T extends object> (obj: T): T

declare type PluginInstallFunction = (app: Mpx, ...options: any[]) => any;

export type Plugin = PluginInstallFunction | {
  install: PluginInstallFunction;
};

export interface Mpx {
  getMixin: typeof getMixin
  mixin: typeof injectMixins
  injectMixins: typeof injectMixins
  toPureObject: typeof toPureObject
  observable: typeof observable

  // watch: typeof watch

  use (plugin: Plugin, ...rest: any[]): Mpx

  implement (name: string, options?: ImplementOptions): void

  set: typeof set

  remove: typeof del

  delete: typeof del

  config: MpxConfig

  i18n: {
    readonly global: UseI18n
    dispose (): void
  }
}

type GetFunctionKey<T> = {
  [K in keyof T]: T[K] extends (...args: any) => any ? K : never
}[keyof T]

declare let mpx: Mpx & Pick<WechatMiniprogram.Wx, GetFunctionKey<WechatMiniprogram.Wx>>

export default mpx

// composition api

declare const RefSymbol: unique symbol
declare const ReactiveSymbol: unique symbol
declare const ComputedRefSymbol: unique symbol
declare const ShallowRefMarker: unique symbol
declare const ShallowReactiveMarker: unique symbol

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
export interface RefUnwrapBailTypes {
}

export type UnwrapRef<T> = T extends ShallowRef<infer V>
  ? V
  : T extends Ref<infer V>
    ? UnwrapRefSimple<V>
    : UnwrapRefSimple<T>

export type UnwrapRefSimple<T> = T extends | Function
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
  | (() => T) // getter
  | ComputedRef<T>

type MultiWatchSources = (WatchSource<unknown> | object)[]

interface WatchEffectOptions {
  flush?: 'pre' | 'post' | 'sync' // default: 'pre'
}

export interface WatchOptions extends WatchEffectOptions {
  immediate?: boolean // 默认：false
  deep?: boolean // 默认：false
  flush?: 'pre' | 'post' | 'sync' // 默认：'pre'
}

interface EffectScope {
  run<T> (fn: () => T): T | undefined // 如果作用域不活跃就为 undefined
  stop (): void
}


type StringObj = {
  [k: string]: string | StringObj
}

interface UseI18n {
  id: number
  locale: string
  fallbackLocale: string
  readonly messages: StringObj
  readonly isGlobal: boolean
  inheritLocale: boolean
  fallbackRoot: boolean

  t (key: string, values?: I18nValues): string

  t (key: string, choice: number, values?: I18nValues): string

  te (key: string): boolean

  tm (key: string): any

  getLocaleMessage (locale: string): StringObj

  setLocaleMessage (locale: string, messages: StringObj): void

  mergeLocaleMessage (locale: string, messages: StringObj): void
}


export function ref<T extends object> (
  value: T
): [T] extends [Ref] ? T : Ref<UnwrapRef<T>>
export function ref<T> (value: T): Ref<UnwrapRef<T>>
export function ref<T = any> (): Ref<T | undefined>

export function unref<T> (ref: T | Ref<T>): T

export function toRef<T extends object, K extends keyof T> (object: T, key: K): ToRef<T[K]>
export function toRef<T extends object, K extends keyof T> (object: T, key: K, defaultValue: T[K]): ToRef<Exclude<T[K], undefined>>

export function toRefs<T extends object> (object: T): ToRefs<T>

export function isRef<T> (r: Ref<T> | unknown): r is Ref<T>
export function isRef (r: any): r is Ref

export function customRef<T> (factory: CustomRefFactory<T>): Ref<T>

export function shallowRef<T extends object> (value: T): T extends Ref ? T : ShallowRef<T>
export function shallowRef<T> (value: T): ShallowRef<T>
export function shallowRef<T = any> (): ShallowRef<T | undefined>

export function triggerRef (ref: Ref): void

export function reactive<T extends object> (target: T): Reactive<T>

export function isReactive (value: unknown): boolean

/**
 * Return a shallowly-reactive copy of the original object, where only the root
 * level properties are reactive. It also does not auto-unwrap refs (even at the
 * root level).
 */
export function shallowReactive<T extends object> (target: T): ShallowReactive<T>

export function computed<T> (
  getter: (...args: any[]) => T
): ComputedRef<T>
export function computed<T> (
  options: WritableComputedOptions<T>
): WritableComputedRef<T>


export function watchEffect (
  effect: (onCleanup: (cleanupFn: () => void) => void) => void,
  options?: WatchEffectOptions
): () => void

export function watchSyncEffect (
  effect: (onCleanup: (cleanupFn: () => void) => void) => void,
  options?: WatchEffectOptions
): void

export function watchPostEffect (
  effect: (onCleanup: (cleanupFn: () => void) => void) => void,
  options?: WatchEffectOptions
): void

export function watch<T extends MultiWatchSources> (
  sources: [...T],
  callback: WatchCallback<T>,
  options?: WatchOptions
): () => void
export function watch<T extends Readonly<MultiWatchSources>> (
  sources: T,
  callback: WatchCallback<T>,
  options?: WatchOptions
): () => void
export function watch<T> ( // for single watcher
  source: WatchSource<T>,
  callback: WatchCallback<T>,
  options?: WatchOptions
): () => void
export function watch<T extends Reactive<object>> ( // for reactive value
  source: T,
  callback: WatchCallback<T>,
  options?: WatchOptions
): () => void

export function effectScope (detached?: boolean): EffectScope

export function getCurrentScope (): EffectScope | undefined

export function onScopeDispose (fn: () => void): void

export function set<T extends object> (target: T, key: string | number, value: any): void

export function del<T extends object> (target: T, key: keyof T): void

// nextTick
export function nextTick (fn: () => any): void

// lifecycle
export function onBeforeMount (callback: () => void): void

export function onMounted (callback: () => void): void

export function onBeforeUpdate (callback: () => void): void

export function onUpdated (callback: () => void): void

export function onBeforeUnmount (callback: () => void): void

export function onUnmounted (callback: () => void): void

export function onLoad<T extends object> (callback: (query: T) => void): void

export function onShow (callback: () => void): void

export function onHide (callback: () => void): void

export function onResize (callback: () => void): void

export function onPullDownRefresh (callback: () => void): void

export function onReachBottom (callback: () => void): void

export function onShareAppMessage (callback: () => void): void

export function onShareTimeline (callback: () => void): void

export function onAddToFavorites (callback: () => void): void

export function onPageScroll (callback: () => void): void

export function onTabItemTap (callback: () => void): void

export function onSaveExitState (callback: () => void): void

// get instance
export function getCurrentInstance<T extends MpxComponentIns> (): { target: T }

// I18n
export function useI18n<Options extends {
  inheritLocale?: boolean
  fallbackRoot?: boolean
  locale?: string
  fallbackLocale?: string
  messages: StringObj
}> (
  options?: Options
): UseI18n

// inner lifecycle
export const BEFORECREATE: string
export const CREATED: string
export const BEFOREMOUNT: string
export const MOUNTED: string
export const BEFOREUPDATE: string
export const UPDATED: string
export const BEFOREUNMOUNT: string
export const UNMOUNTED: string
export const ONLOAD: string
export const ONSHOW: string
export const ONHIDE: string
export const ONRESIZE: string

declare global {
  const defineProps: <T>(props: T) => Readonly<GetPropsType<T>>
  const defineOptions: <D extends Data = {}, P extends Properties = {}, C = {}, M extends Methods = {}, Mi extends Array<any> = [], S extends AnyObject = {}, O extends AnyObject = {}> (opt: ThisTypedComponentOpt<D, P, C, M, Mi, S, O>) => void
  const defineExpose: <E extends AnyObject = AnyObject>(exposed?: E) => void
  const useContext: () => Context
}
