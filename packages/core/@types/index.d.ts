// Type definitions for @mpxjs/core
// Project: https://github.com/didi/mpx
// Definitions by: hiyuki <https://github.com/hiyuki>
// TypeScript Version: 4.1.3

/// <reference types="miniprogram-api-typings" />
/// <reference path="./global.d.ts" />
/// <reference path="./node.d.ts" />

import type { GetComputedType } from '@mpxjs/store'
import type { ScaledSize } from 'react-native'
export * from '@mpxjs/store'

// utils
type ObjectOf<T> = {
  [key: string]: T
}

type AnyObject = ObjectOf<any>

type UnionToIntersection<U> = (U extends any
  ? (k: U) => void
  : never) extends ((k: infer I) => void)
  ? I
  : never

type ArrayType<T extends any[]> = T extends Array<infer R> ? R : never

// Mpx types
type Data = object | (() => object)

export type PropType<T> = {
  __type: T
} & (
    T extends string
    ? StringConstructor
    : T extends number
    ? NumberConstructor
    : T extends boolean
    ? BooleanConstructor
    : T extends any[]
    ? ArrayConstructor
    : T extends object
    ? ObjectConstructor
    : never
  )

type FullPropType<T> = {
  type: PropType<T>
  value?: T
  optionalTypes?: WechatMiniprogram.Component.ShortProperty[]
}

interface Properties {
  [key: string]: WechatMiniprogram.Component.AllProperty
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

type GetDataType<T> = T extends () => any ? ReturnType<T> : T

type GetPropsType<T extends Properties> = {
  readonly [K in keyof T]: T[K] extends FullPropType<infer V>
  ? V
  : T[K] extends PropType<infer V>
  ? V
  : WechatMiniprogram.Component.PropertyToData<T[K]>
}

type RequiredPropertyNames<T> = {
  [K in keyof T]-?: T[K] extends undefined ? never : K
}[keyof T]

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
  asyncRefs: ObjectOf<Promise<WechatMiniprogram.NodesRef & ComponentIns<{}, {}, {}, {}, []>>>

  forceUpdate (params?: object, options?: object | (() => void), callback?: () => void): void

  selectComponent: ReplaceWxComponentIns['selectComponent']
  selectAllComponents: ReplaceWxComponentIns['selectAllComponents']
  createSelectorQuery: WechatMiniprogram.Component.InstanceMethods<Record<string, any>>['createSelectorQuery']
  createIntersectionObserver: WechatMiniprogram.Component.InstanceMethods<Record<string, any>>['createIntersectionObserver'],
  getPageId: WechatMiniprogram.Component.InstanceMethods<Record<string, any>>['getPageId']
}
type ExtendedComponentOptions = {
  disconnectOnUnmounted: boolean
  shallowReactivePattern: RegExp
} & WechatMiniprogram.Component.ComponentOptions

interface ComponentOpt<D extends Data, P extends Properties, C, M extends Methods, Mi extends Array<any>, S extends Record<any, any>> extends Partial<WechatMiniprogram.Component.Lifetimes & WechatMiniprogram.Component.OtherOption> {
  data?: D
  properties?: P
  computed?: C
  methods?: M
  mixins?: Mi
  watch?: WatchField
  options?: ExtendedComponentOptions
  setup?: (props: GetPropsType<P & UnboxMixinsField<Mi, 'properties'>>, context: Context) => S

  pageShow?: () => void

  pageHide?: () => void

  initData?: Record<string, any>

  provide?: Record<string, any> | (() => Record<string, any>)
  inject?:
  | { [key: string]: string | Symbol | { from?: string | Symbol; default?: any } }
  | Array<string>

  [index: string]: any
}

type PageOpt<D extends Data, P extends Properties, C, M extends Methods, Mi extends Array<any>, S extends Record<any, any>> =
  ComponentOpt<D, P, C, M, Mi, S>
  & Partial<WechatMiniprogram.Page.ILifetime>

type ThisTypedPageOpt<D extends Data, P extends Properties, C, M extends Methods, Mi extends Array<any>, S extends Record<any, any>, O = {}> =
  PageOpt<D, P, C, M, Mi, S>
  & ThisType<ComponentIns<D, P, C, M, Mi, S, O>> & O

type ThisTypedComponentOpt<D extends Data, P extends Properties, C, M extends Methods, Mi extends Array<any>, S extends Record<any, any>, O = {}> =
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
  $asyncRefs: ObjectOf<Promise<WechatMiniprogram.NodesRef & ComponentIns<{}, {}, {}, {}, []>>>
  $set: typeof set
  $remove: typeof del
  $delete: typeof del

  $watch (expr: string | (() => any), handler: WatchHandler | WatchOptWithHandler, options?: WatchOpt): () => void

  $forceUpdate (params?: object, options?: object | (() => void), callback?: () => void): void

  $nextTick (fn: () => void): void

  $i18n: {
    locale: string
    fallbackLocale: string
  }
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

type WxComponentIns<D extends Data = {}, P extends Properties = {}, M extends Methods = {}> =
  Omit<WechatMiniprogram.Component.Instance<D, P, M>, 'selectComponent' | 'selectAllComponents'>
  & ReplaceWxComponentIns

type ComponentIns<D extends Data = {}, P extends Properties = {}, C = {}, M extends Methods = {}, Mi extends Array<any> = [], S extends Record<any, any> = {}, O = {}> =
  GetDataType<D> & UnboxMixinsField<Mi, 'data'> &
  M & UnboxMixinsField<Mi, 'methods'> & { [K in keyof S]: S[K] extends Ref<infer V> ? V : S[K] } &
  GetPropsType<P & UnboxMixinsField<Mi, 'properties'>> &
  GetComputedType<C & UnboxMixinsField<Mi, 'computed'>> &
  WxComponentIns<D, P, M> & MpxComponentIns & MpxComProps<O>

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

export function injectMixins (mixins: object | Array<object>, options?: MixinType | MixinType[] | {
  types?: MixinType | MixinType[],
  stage?: number
}): Mpx

// export function watch (expr: string | (() => any), handler: WatchHandler | WatchOptWithHandler, options?: WatchOpt): () => void

interface AnyConstructor {
  new(...args: any[]): any

  prototype: any
}

export interface WebviewConfig {
  hostWhitelists?: Array<string>
  apiImplementations?: object
}

/**
 * 输出为 ReactNative 时使用的特殊配置，用于与容器进行功能桥接
 */
export interface RnConfig {
  /**
   * 当导航状态发生变化时触发，例如页面跳转、返回等。
   *
   * @param state 当前的导航状态对象
   */
  onStateChange?: (state: Record<string, any>) => void;

  /**
   * 用于获取初始路由配置的函数。
   *
   * @param props ReactNative根组件接收到的参数
   * @returns
   * - `object`：包含 `initialRouteName` 和 `initialParams`
   * - 或不返回，表示不设置初始路由
   */
  parseAppProps?: (
    props: Record<string, any>
  ) => { initialRouteName?: string; initialParams?: any } | void;

  /**
   * 页面栈长度为 1（即根页面）且用户尝试退出 App 时触发。
   *
   * @returns
   * - `true`：允许退出应用
   * - `false`：阻止退出应用
   */
  onAppBack?: () => boolean;

  /**
   * 是否禁用框架内部的 AppStateChange 监听。
   */
  disableAppStateListener?: boolean;

  /**
   * 控制首页回退按钮是否展示，并监听点击事件。
   *
   * 如果绑定该函数，则首页显示返回按钮，点击后调用该函数作为回调。
   * 如需返回，请在函数内部手动调用 `back()`。
   */
  onStackTopBack?: () => void;

  /**
   * 容器实现的 open-type 能力集合。
   */
  openTypeHandler?: {
    /**
     * 在使用 button 组件并指定 `open-type="share"` 时触发分享。
     *
     * @param shareInfo 分享参数对象
     * @param shareInfo.title 分享标题
     * @param shareInfo.path 分享路径
     * @param shareInfo.imageUrl 可选的分享图片
     * @returns `void`
     */
    onShareAppMessage?: (shareInfo: {
      title: string;
      path: string;
      imageUrl?: string;
    }) => void;
  };

  /**
   * 在使用 picker-view-column 时，触发短震动反馈。
   */
  pickerVibrate?: () => void;

  /**
   * 自定义屏幕尺寸信息，用于 mpx style 渲染等依赖尺寸的功能。
   *
   * @param dimensions 包含 window 和 screen 的尺寸信息
   * @returns 返回修改后的尺寸对象，或 void 表示不修改
   */
  customDimensions?: <T extends { window: ScaledSize; screen: ScaledSize }>(
    dimensions: T
  ) => T | void;

  /**
   * 异步分包加载配置。
   */
  asyncChunk?: {
    /**
     * 加载超时时长配置，单位为毫秒。
     */
    timeout: number;

    /**
     * 异步分包页面加载超时或失败时，自定义兜底页面文件路径。
     */
    fallback: string;

    /**
     * 异步分包页面加载时，自定义 loading 页面文件路径。
     */
    loading: string;
  };

  /**
   * 加载并执行异步分包的方法。
   *
   * @param params 分包下载参数
   * @param params.url 资源地址
   * @param params.package 分包名
   * @returns Promise，表示加载完成
   */
  loadChunkAsync?: (params: { url: string; package: string }) => Promise<any>;

  /**
   * 下载多个异步分包的方法（不执行）。
   *
   * @param packages 分包名数组
   */
  downloadChunkAsync?: (packages: Array<string>) => void;
}

interface MpxConfig {
  useStrictDiff: boolean
  ignoreWarning: boolean | string | RegExp | ((msg: string, location: string, e: Error) => boolean)
  ignoreProxyWhiteList: Array<string>
  observeClassInstance: boolean | Array<AnyConstructor>
  errorHandler: (msg: String, location: String, e: Error) => any | null
  warnHandler: (msg: String, location: String, e: Error) => any | null
  proxyEventHandler: (e: WechatMiniprogram.CustomEvent, target: ComponentIns<{}, {}, {}, {}, []>) => any | null
  setDataHandler: (data: object, target: ComponentIns<{}, {}, {}, {}, []>) => any | null
  forceFlushSync: boolean,
  webRouteConfig: object,
  webConfig: object,
  /*
   * 支持两个属性
   * hostWhitelists Array 类型 支持h5域名白名单安全校验
   * apiImplementations webview JSSDK接口 例如getlocation
  */
  webviewConfig: WebviewConfig,
  /** react-native 相关配置，用于挂载事件等，如 onShareAppMessage */
  rnConfig?: RnConfig,
}

type SupportedMode = 'wx' | 'ali' | 'qq' | 'swan' | 'tt' | 'web' | 'qa'

interface ImplementOptions {
  modes?: Array<SupportedMode>
  processor?: () => any
  remove?: boolean
}

export function toPureObject<T extends object> (obj: T): T

declare type PluginInstallFunction = (app: Mpx, ...options: any[]) => any

export type Plugin = PluginInstallFunction | {
  install: PluginInstallFunction
}

export type PluginFunction<T extends Plugin> = T extends PluginInstallFunction ? T : T extends { install: infer U } ? U : never

export type PluginFunctionParams<T extends PluginInstallFunction> = T extends (app: any, ...args: infer P) => any ? P : []

export interface Mpx {
  getMixin: typeof getMixin
  mixin: typeof injectMixins
  injectMixins: typeof injectMixins
  toPureObject: typeof toPureObject
  observable: typeof observable
  watch: typeof watch

  use<T extends Plugin = Plugin> (plugin: T, ...rest: PluginFunctionParams<PluginFunction<T>>): Mpx

  implement (name: string, options?: ImplementOptions): void

  set: typeof set

  remove: typeof del

  delete: typeof del

  provide: typeof provide

  config: MpxConfig

  i18n: {
    readonly global: UseI18n
    dispose (): void
    locale: string
    fallbackLocale: string
    t: typeof t
    tc: typeof tc
    te: typeof te
    tm: typeof tm
  }

  __vue: any
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

export type WritableComputedRef<T> = Ref<T>

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
  stop (fromParent?: boolean): void

  pause (): void

  resume (ignoreDirty?: boolean): void
}

type StringObj = {
  [k: string]: string | StringObj
}

interface UseI18n {
  id: number
  locale: WritableComputedRef<string>
  fallbackLocale: string
  readonly messages: StringObj
  readonly isGlobal: boolean
  inheritLocale: boolean
  fallbackRoot: boolean

  t: typeof t & typeof tc

  te: typeof te

  tm: typeof tm

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

export function markRaw<T extends object> (value: T): T

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
  callback: WatchCallback<{
    [K in keyof T]: T[K] extends WatchSource<infer V> ? V : T[K] extends object ? T[K] : never
  }>,
  options?: WatchOptions
): () => void
export function watch<T extends Readonly<MultiWatchSources>> (
  sources: T,
  callback: WatchCallback<{
    [K in keyof T]: T[K] extends WatchSource<infer V> ? V : T[K] extends object ? T[K] : never
  }>,
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

// provide & inject
export declare function provide<T> (key: InjectionKey<T> | string | number, value: T): void
export declare function inject<T> (key: InjectionKey<T> | string): T | undefined
export declare function inject<T> (key: InjectionKey<T> | string, defaultValue: T, treatDefaultAsFactory?: false): T
export declare function inject<T> (key: InjectionKey<T> | string, defaultValue: T | (() => T), treatDefaultAsFactory: true): T
export declare interface InjectionKey<T> extends Symbol { }

// nextTick
export function nextTick (fn: () => any): void

// lifecycle
export function onBeforeMount (callback: () => void): void
export function onMounted (callback: () => void): void
export function onBeforeUpdate (callback: () => void): void
export function onUpdated (callback: () => void): void
export function onBeforeUnmount (callback: () => void): void
export function onUnmounted (callback: () => void): void
export function onLoad<T extends Record<string, string | undefined>> (callback: (query: T) => void): void
export function onShow (callback: WechatMiniprogram.Page.ILifetime['onShow']): void
export function onHide (callback: WechatMiniprogram.Page.ILifetime['onHide']): void
export function onResize (callback: WechatMiniprogram.Page.ILifetime['onResize']): void
export function onPullDownRefresh (callback: WechatMiniprogram.Page.ILifetime['onPullDownRefresh']): void
export function onReachBottom (callback: WechatMiniprogram.Page.ILifetime['onReachBottom']): void
export function onShareAppMessage (callback: WechatMiniprogram.Page.ILifetime['onShareAppMessage']): void
export function onShareTimeline (callback: WechatMiniprogram.Page.ILifetime['onShareTimeline']): void
export function onAddToFavorites (callback: WechatMiniprogram.Page.ILifetime['onAddToFavorites']): void
export function onPageScroll (callback: WechatMiniprogram.Page.ILifetime['onPageScroll']): void
export function onTabItemTap (callback: WechatMiniprogram.Page.ILifetime['onTabItemTap']): void
export function onSaveExitState (callback: () => void): void
export function onServerPrefetch (callback: () => any): void
export function onReactHooksExec (callback: () => void): void

// get instance
export function getCurrentInstance<T extends ComponentIns<{}, {}, {}>> (): { proxy: T, [x: string]: any }

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

// `<script setup>`
type NotUndefined<T> = T extends undefined ? never : T

type InferDefaults<T> = {
  [K in keyof T]?: InferDefault<T, NotUndefined<T[K]>>
}

type InferDefault<P, T> = T extends | null
  | number
  | string
  | boolean
  | symbol
  | Array<any>
  | Object
  ? T | ((props: P) => T)
  : (props: P) => T

type PropsWithDefaults<Base, Defaults> = Base & {
  [K in keyof Defaults]: K extends keyof Base ? NotUndefined<Base[K]> : never
}

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
export const SERVERPREFETCH: string
export const REACTHOOKSEXEC: string

declare global {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  const defineProps: (<T extends Properties = {}>(props: T) => Readonly<GetPropsType<T>>) & (<T>() => Readonly<T>)
  const defineOptions: <D extends Data = {}, P extends Properties = {}, C = {}, M extends Methods = {}, Mi extends Array<any> = [], S extends AnyObject = {}, O extends AnyObject = {}> (opt: ThisTypedComponentOpt<D, P, C, M, Mi, S, O>) => void
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  const defineExpose: <E extends AnyObject = AnyObject>(exposed?: E) => void
  const useContext: () => Context
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  const withDefaults: <Props, Defaults extends InferDefaults<Props>>(props: Props, defaults: Defaults) => PropsWithDefaults<Props, Defaults>
}
