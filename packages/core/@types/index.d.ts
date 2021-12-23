// Type definitions for @mpxjs/core
// Project: https://github.com/didi/mpx
// Definitions by: hiyuki <https://github.com/hiyuki>
// TypeScript Version: 4.1.3

/// <reference types="miniprogram-api-typings" />
/// <reference path="./mpx-store.d.ts" />
/// <reference path="./global.d.ts" />
/// <reference path="./node.d.ts" />

// declare Store types
type StoreOpt<S, G, M, A, D extends MpxStore.Deps> = MpxStore.StoreOpt<S, G, M, A, D>

type Store<S = {}, G = {}, M = {}, A = {}, D extends Deps = {}> = MpxStore.Store<S, G, M, A, D>

type StoreOptWithThis<S, G, M, A, D extends Deps> = MpxStore.StoreOptWithThis<S, G, M, A, D>

type StoreWithThis<S = {}, G = {}, M = {}, A = {}, D extends Deps = {}> = MpxStore.StoreWithThis<S, G, M, A, D>

type UnboxDepsField<D extends Deps, F> = MpxStore.UnboxDepsField<D, F>

type GetComputedType<T> = MpxStore.GetComputedType<T>

type GetDispatchAndCommitWithThis<A, D extends Deps, AK extends 'actions' | 'mutations'> = MpxStore.GetDispatchAndCommitWithThis<A, D, AK>

type MutationsAndActionsWithThis = MpxStore.MutationsAndActionsWithThis

type Actions<S, G extends MpxStore.Getters<S>> = MpxStore.Actions<S, G>

type Mutations<S> = MpxStore.Mutations<S>

type Getters<S> = MpxStore.Getters<S>

type Deps = MpxStore.Deps

// utils
type ObjectOf<T> = {
  [key: string]: T
}

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

interface ComponentOpt<D, P, C, M, Mi extends Array<any>> extends Partial<WechatMiniprogram.Component.Lifetimes> {
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

  pageShow?: () => void

  pageHide?: () => void

  externalClasses?: string[]

  lifetimes?: Partial<WechatMiniprogram.Component.Lifetimes>

  pageLifetimes?: Partial<WechatMiniprogram.Component.PageLifetimes>

  relations?: { [key: string]: WechatMiniprogram.Component.RelationOption }

  [index: string]: any
}

type PageOpt<D, P, C, M, Mi extends Array<any>> =
  ComponentOpt<D, P, C, M, Mi>
  & Partial<WechatMiniprogram.Page.ILifetime>

type ThisTypedPageOpt<D, P, C, M, Mi extends Array<any>, O = {}> =
  PageOpt<D, P, C, M, Mi>
  & ThisType<ComponentIns<D, P, C, M, Mi, O>> & O

type ThisTypedComponentOpt<D, P, C, M, Mi extends Array<any>, O = {}> =
  ComponentOpt<D, P, C, M, Mi>
  & ThisType<ComponentIns<D, P, C, M, Mi, O>> & O

type I18nValues = {
  [k: string]: string
} | Array<string>

declare function get (obj: object, key: string): any

declare function set (obj: object, key: string, value: any): any

declare function del (obj: object, key: string): any

declare function t (key: string, values?: I18nValues): string

declare function tc (key: string, choice: number, values?: I18nValues): string

declare function te (key: string): boolean

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

  $i18n: {
    locale: string
  }

  $t: typeof t

  $tc: typeof tc

  $te: typeof te

  [k: string]: any
}

interface ReplaceWxComponentIns {
  selectComponent (selector: string): ComponentIns<{}, {}, {}, {}, []>

  selectAllComponents (selector: string): Array<ComponentIns<{}, {}, {}, {}, []>>
}

type WxComponentIns<D> =
  ReplaceWxComponentIns
  & WechatMiniprogram.Component.InstanceProperties
  & WechatMiniprogram.Component.InstanceMethods<D>

type ComponentIns<D, P, C, M, Mi extends Array<any>, O = {}> =
  GetDataType<D> & UnboxMixinsField<Mi, 'data'> &
  M & UnboxMixinsField<Mi, 'methods'> &
  GetPropsType<P & UnboxMixinsField<Mi, 'properties'>> &
  GetComputedType<C & UnboxMixinsField<Mi, 'computed'>> &
  WxComponentIns<D> & MpxComponentIns & MpxComProps<O>

interface CreateConfig {
  customCtor: any
}

export function createComponent<D extends Data = {}, P extends Properties = {}, C = {}, M extends Methods = {}, Mi extends Array<any> = [], O = {}> (opt: ThisTypedComponentOpt<D, P, C, M, Mi, O>, config?: CreateConfig): void

export function getMixin<D extends Data = {}, P extends Properties = {}, C = {}, M extends Methods = {}, Mi extends Array<any> = [], O = {}> (opt: ThisTypedComponentOpt<D, P, C, M, Mi, O>): {
  data: GetDataType<D> & UnboxMixinsField<Mi, 'data'>
  properties: P & UnboxMixinsField<Mi, 'properties'>
  computed: C & UnboxMixinsField<Mi, 'computed'>
  methods: M & UnboxMixinsField<Mi, 'methods'>
  [index: string]: any
}

export function createPage<D extends Data = {}, P extends Properties = {}, C = {}, M extends Methods = {}, Mi extends Array<any> = [], O = {}> (opt: ThisTypedPageOpt<D, P, C, M, Mi, O>, config?: CreateConfig): void

export function createApp<T extends WechatMiniprogram.IAnyObject> (opt: WechatMiniprogram.App.Options<T>, config?: CreateConfig): void

export function createStore<S, G extends Getters<S>, M extends Mutations<S>, A extends Actions<S, G>, D extends Deps = {}> (option: StoreOpt<S, G, M, A, D>): Store<S, G, M, A, D>

export function createStoreWithThis<S = {}, G = {}, M extends MutationsAndActionsWithThis = {}, A extends MutationsAndActionsWithThis = {}, D extends Deps = {}> (option: StoreOptWithThis<S, G, M, A, D>): StoreWithThis<S, G, M, A, D>

// auxiliary functions
export function createStateWithThis<S = {}> (state: S): S

export function createGettersWithThis<S = {}, D extends Deps = {}, G = {}, OG = {}> (getters: G & ThisType<{ state: S & UnboxDepsField<D, 'state'>, getters: GetComputedType<G & OG> & UnboxDepsField<D, 'getters'>, rootState: any }>, options?: {
  state?: S,
  getters?: OG,
  deps?: D
}): G

export function createMutationsWithThis<S = {}, D extends Deps = {}, M extends MutationsAndActionsWithThis = {}> (mutations: M & ThisType<{ state: S & UnboxDepsField<D, 'state'>, commit: GetDispatchAndCommitWithThis<M, D, 'mutations'> }>, options?: {
  state?: S,
  deps?: D
}): M

export function createActionsWithThis<S = {}, G = {}, M extends MutationsAndActionsWithThis = {}, D extends Deps = {}, A extends MutationsAndActionsWithThis = {}, OA extends MutationsAndActionsWithThis = {}> (actions: A & ThisType<{
  rootState: any,
  state: S & UnboxDepsField<D, 'state'>,
  getters: GetComputedType<G> & UnboxDepsField<D, 'getters'>,
  dispatch: GetDispatchAndCommitWithThis<A & OA, D, 'actions'>,
  commit: GetDispatchAndCommitWithThis<M, D, 'mutations'>
} & MpxStore.CompatibleDispatch>, options?: {
  state?: S,
  getters?: G,
  mutations?: M,
  actions?: OA,
  deps?: D
}): A

type MixinType = 'app' | 'page' | 'component'

export function injectMixins (mixins: object | Array<object>, options?: MixinType | MixinType[] | { types?: MixinType | MixinType[], stage?: number }): void

export function watch (expr: string | (() => any), handler: WatchHandler | WatchOptWithHandler, options?: WatchOpt): () => void

interface AnyConstructor {
  new (...args: any[]): any

  prototype: any
}

interface MpxConfig {
  useStrictDiff: boolean
  ignoreWarning: boolean | string | RegExp | ((msg: string, location: string, e: Error) => boolean)
  ignoreConflictWhiteList: Array<string>
  observeClassInstance: boolean | Array<AnyConstructor>
  hookErrorHandler: (e: Error, target: ComponentIns<{}, {}, {}, {}, []>, hookName: string) => any | null
  proxyEventHandler: (e: Event) => any | null
  setDataHandler: (data: object, target: ComponentIns<{}, {}, {}, {}, []>) => any | null
  forceRunWatcherSync: boolean,
  webRouteConfig: object
}

type SupportedMode = 'wx' | 'ali' | 'qq' | 'swan' | 'tt' | 'web' | 'qa'

interface ImplementOptions {
  modes?: Array<SupportedMode>
  processor?: () => any
  remove?: boolean
}

export function toPureObject<T extends object> (obj: T): T

export interface Mpx {
  createComponent: typeof createComponent
  createPage: typeof createPage
  createApp: typeof createApp
  createStore: typeof createStore
  createStoreWithThis: typeof createStoreWithThis
  getMixin: typeof getMixin
  mixin: typeof injectMixins
  injectMixins: typeof injectMixins
  toPureObject: typeof toPureObject
  observable: typeof observable

  watch: typeof watch

  use (plugin: ((...args: any) => any) | { install: (...args: any) => any, [key: string]: any }, ...rest: any): Mpx

  implement (name: string, options?: ImplementOptions): void

  set: typeof set

  remove: typeof del

  delete: typeof del

  config: MpxConfig

  i18n: {
    locale: string,
    version: number
    t: typeof t
    tc: typeof tc
    te: typeof te
    mergeMessages (messages: object): void
    mergeLocaleMessage (locale: string, message: object): void
  }
}

type GetFunctionKey<T> = {
  [K in keyof T]: T[K] extends (...args: any) => any ? K : never
}[keyof T]

declare let mpx: Mpx & Pick<WechatMiniprogram.Wx, GetFunctionKey<WechatMiniprogram.Wx>>

export default mpx
