// Type definitions for @mpxjs/core
// Project: https://github.com/didi/mpx
// Definitions by: hiyuki <https://github.com/hiyuki>
// TypeScript Version: 3.5

/// <reference types="miniprogram-api-typings" />

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

type GetComputedSetKeys<T> = {
  [K in keyof T]: T[K] extends {
    get (): any,
    set (val: any): void
  } ? K : never
}[keyof T]


type GetComputedType<T> = {
  readonly [K in Exclude<keyof T, GetComputedSetKeys<T>>]: T[K] extends () => infer R ? R : T[K]
} & {
  [K in GetComputedSetKeys<T>]: T[K] extends {
    get (): infer R,
    set (val: any): void
  } ? R : T[K]
}

type PropValueType<Def> = Def extends {
    type: (...args: any[]) => infer T;
    value?: infer T;
  }
  ? T
  : Def extends (...args: any[]) => infer T
    ? T
    : never;

type GetPropsType<T> = {
  readonly [K in keyof T]: PropValueType<T[K]>
}

type UnionToIntersection<U> = (U extends any
  ? (k: U) => void
  : never) extends ((k: infer I) => void)
  ? I
  : never;

type ArrayType<T extends any[]> = T extends Array<infer R> ? R : never;

type RequiredPropertyNames<T> = {
  [K in keyof T]-?: undefined extends T[K] ? never : K
}[keyof T];

type RequiredPropertiesForUnion<T> = T extends object ? Pick<T, RequiredPropertyNames<T>> : T

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
  computed?: C & ThisType<ComponentInsInComputed<D, P, C, M, Mi>>
  methods?: M
  mixins?: Mi
  watch?: WatchField
  observers?: ObserversDefs
  options?: Partial<{
    addGlobalClass: boolean
    multipleSlots: boolean
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
  & Partial<WechatMiniprogram.Component.PageLifetimes>

type ThisTypedPageOpt<D, P, C, M, Mi extends Array<any>> =
  PageOpt<D, P, C, M, Mi>
  & ThisType<ComponentIns<D, P, C, M, Mi>>


type ThisTypedComponentOpt<D, P, C, M, Mi extends Array<any>> =
  ComponentOpt<D, P, C, M, Mi>
  & ThisType<ComponentIns<D, P, C, M, Mi>>

declare function get (obj: object, key: string): any

declare function set (obj: object, key: string, value: any): any

declare function observable<T extends object> (obj: T): T

declare function remove (obj: object, key: string): any

export interface MpxComponentIns {
  $refs: ObjectOf<any>

  $set: typeof set

  $remove: typeof remove

  $watch (expr: string | (() => any), handler: WatchHandler | WatchOptWithHandler, options?: WatchOpt): () => void

  $forceUpdate (params: object, callback: () => void): void

  $nextTick (fn: () => void): void
}

interface ReplaceWxComponentIns {
  selectComponent (selector: string): ComponentIns<{}, {}, {}, {}, []>

  selectAllComponents (selector: string): Array<ComponentIns<{}, {}, {}, {}, []>>
}

type WxComponentIns<D> =
  ReplaceWxComponentIns
  & WechatMiniprogram.Component.InstanceProperties
  & WechatMiniprogram.Component.InstanceMethods<D>

type ComponentInsInComputed<D, P, C, M, Mi extends Array<any>> =
  GetDataType<D> & UnboxMixinsField<Mi, 'data'> &
  M & UnboxMixinsField<Mi, 'methods'> &
  GetPropsType<P & UnboxMixinsField<Mi, 'properties'>> &
  C & UnboxMixinsField<Mi, 'computed'> & WxComponentIns<D> & MpxComponentIns

type ComponentIns<D, P, C, M, Mi extends Array<any>> =
  GetDataType<D> & UnboxMixinsField<Mi, 'data'> &
  M & UnboxMixinsField<Mi, 'methods'> &
  GetPropsType<P & UnboxMixinsField<Mi, 'properties'>> &
  GetComputedType<C & UnboxMixinsField<Mi, 'computed'>> & WxComponentIns<D> & MpxComponentIns

interface createConfig {
  customCtor: any
}

export function createComponent<D extends Data = {}, P extends Properties = {}, C = {}, M extends Methods = {}, Mi extends Array<any> = []> (opt: ThisTypedComponentOpt<D, P, C, M, Mi>, config?: createConfig): void

export function getMixin<D extends Data = {}, P extends Properties = {}, C = {}, M extends Methods = {}, Mi extends Array<any> = []> (opt: ThisTypedComponentOpt<D, P, C, M, Mi>): {
  data: GetDataType<D> & UnboxMixinsField<Mi, 'data'>
  properties: P & UnboxMixinsField<Mi, 'properties'>
  computed: C & UnboxMixinsField<Mi, 'computed'>
  methods: M & UnboxMixinsField<Mi, 'methods'>
  [index: string]: any
}

export function getComputed<C> (computed: C): C extends (...args: any[]) => any ? ReturnType<C> : C

export function createPage<D extends Data = {}, P extends Properties = {}, C = {}, M extends Methods = {}, Mi extends Array<any> = []> (opt: ThisTypedPageOpt<D, P, C, M, Mi>, config?: createConfig): void

export function createApp<T extends WechatMiniprogram.IAnyObject> (opt: WechatMiniprogram.App.Options<T>, config?: createConfig): void

type Mutations<S> = {
  [key: string]: (this: void, state: S, ...payload: any[]) => any
}


type Getters<S> = {
  [key: string]: (this: void, state: S, getters: any, globalState: any) => any
}


type Actions<S, G extends Getters<S>> = {
  [key: string]: (this: void, context: {
    rootState: any,
    state: S,
    getters: GetGetters<G>,
    dispatch: (type: string, ...payload: any[]) => any,
    commit: (type: string, ...payload: any[]) => any
  }, ...payload: any[]) => any
}

type getMutation<M> = M extends (state: any, ...payload: infer P) => infer R ? (...payload: P) => R : never

type getAction<A> = A extends (context: object, ...payload: infer P) => infer R ? (...payload: P) => R : never

type GetGetters<G> = {
  readonly [K in keyof G]: G[K] extends (state: any, getters: any, globalState: any) => infer R ? R : G[K]
}

type GetMutations<M> = {
  [K in keyof M]: getMutation<M[K]>
}

type GetActions<A> = {
  [K in keyof A]: getAction<A[K]>
}

type ObjectOf<T> = {
  [key: string]: T
}

interface StoreOpt<S, G, M, A, D extends Deps> {
  state?: S,
  getters?: G
  mutations?: M,
  actions?: A,
  deps?: D
  modules?: ObjectOf<StoreOpt<{}, {}, {}, {}, {}>>
}

interface Deps {
  [key: string]: Store | StoreWithThis
}

type UnboxDepsField<D extends Deps, F> = string extends keyof D ? {} : {
  [K in keyof D]: UnboxDepField<D[K], F>
}

type UnboxDepField<D, F> = F extends keyof D ? D[F] : {}

type GetDispatch<A, D> = keyof D extends never ? (<T extends keyof A>(type: T, ...payload: A[T] extends (context: any, ...payload: infer P) => any ? P : never) => A[T] extends (context: any, ...payload: any[]) => infer R ? R : never) : ((type: string, ...payload: any[]) => any)

type GetCommit<M, D> = keyof D extends never ? (<T extends keyof M>(type: T, ...payload: M[T] extends (state: any, ...payload: infer P) => any ? P : never) => M[T] extends (state: any, ...payload: any[]) => infer R ? R : never) : ((type: string, ...payload: any[]) => any)


declare class Store<S = {}, G = {}, M = {}, A = {}, D extends Deps = {}> {

  state: S & UnboxDepsField<D, 'state'>
  getters: GetGetters<G> & UnboxDepsField<D, 'getters'>
  mutations: GetMutations<M> & UnboxDepsField<D, 'mutations'>
  actions: GetActions<A> & UnboxDepsField<D, 'actions'>

  dispatch: GetDispatch<A, D>

  commit: GetCommit<M, D>

  mapState<K extends keyof S> (maps: K[]): {
    [I in K]: () => S[I]
  }
  mapState (depPath: string, maps: string[]): object

  mapGetters<K extends keyof G> (maps: K[]): {
    [I in K]: () => GetGetters<G>[I]
  }
  mapGetters (depPath: string, maps: string[]): {
    [key: string]: () => any
  }

  mapMutations<K extends keyof M> (maps: K[]): Pick<GetMutations<M>, K>
  mapMutations (depPath: string, maps: string[]): {
    [key: string]: (...payloads: any[]) => any
  }

  mapActions<K extends keyof A> (maps: K[]): Pick<GetActions<A>, K>
  mapActions (depPath: string, maps: string[]): {
    [key: string]: (...payloads: any[]) => any
  }

}

export function createStore<S, G extends Getters<S>, M extends Mutations<S>, A extends Actions<S, G>, D extends Deps = {}> (option: StoreOpt<S, G, M, A, D>): Store<S, G, M, A, D>


interface MutationsAndActionsWithThis {
  [key: string]: (...payload: any[]) => any
}

type GetDispatchAndCommitWithThis<A, D> = keyof D extends never ? (<T extends keyof A>(type: T, ...payload: A[T] extends (...payload: infer P) => any ? P : never) => A[T] extends (...payload: any[]) => infer R ? R : never) : ((type: string, ...payload: any[]) => any)

interface StoreOptWithThis<S, G, M, A, D extends Deps> {
  state?: S
  getters?: G & ThisType<{ state: S & UnboxDepsField<D, 'state'>, getters: G & UnboxDepsField<D, 'getters'>, rootState: any }>
  mutations?: M & ThisType<{ state: S & UnboxDepsField<D, 'state'> }>
  actions?: A & ThisType<{
    rootState: any,
    state: S & UnboxDepsField<D, 'state'>,
    getters: GetComputedType<G> & UnboxDepsField<D, 'getters'>,
    dispatch: GetDispatchAndCommitWithThis<A, D>,
    commit: GetDispatchAndCommitWithThis<M, D>
  }>
  deps?: D
  modules?: ObjectOf<StoreOptWithThis<{}, {}, {}, {}, {}>>
}

interface mapStateFunctionType<S, G> {
  [key: string]: (state: S, getter: G) => any
}

declare class StoreWithThis<S = {}, G = {}, M = {}, A = {}, D extends Deps = {}> {

  state: S & UnboxDepsField<D, 'state'>
  getters: GetComputedType<G> & UnboxDepsField<D, 'getters'>
  mutations: M & UnboxDepsField<D, 'mutations'>
  actions: A & UnboxDepsField<D, 'actions'>

  dispatch: GetDispatchAndCommitWithThis<A, D>

  commit: GetDispatchAndCommitWithThis<M, D>

  mapState<K extends keyof S> (maps: K[]): {
    [I in K]: () => S[I]
  }
  mapState (depPath: string, maps: string[]): {
    [key: string]: () => any
  }
  mapState<T extends mapStateFunctionType<S & UnboxDepsField<D, 'state'>, GetComputedType<G> & UnboxDepsField<D, 'getters'>>> (obj: ThisType<any> & T): {
    [I in keyof T]: ReturnType<T[I]>
  }
  mapState<T extends { [key: string]: keyof S }> (obj: T): {
    [I in keyof T]: () => S[T[I]]
  }
  mapState<T extends { [key: string]: string }> (obj: T): {
    [I in keyof T]: (...payloads: any[]) => any
  }

  mapGetters<K extends keyof G> (maps: K[]): Pick<G, K>
  mapGetters (depPath: string, maps: string[]): {
    [key: string]: () => any
  }
  mapGetters<T extends { [key: string]: keyof G }> (obj: T): {
    [I in keyof T]: G[T[I]]
  }
  mapGetters<T extends { [key: string]: string }> (obj: T): {
    [I in keyof T]: (...payloads: any[]) => any
  }

  mapMutations<K extends keyof M> (maps: K[]): Pick<M, K>
  mapMutations (depPath: string, maps: string[]): {
    [key: string]: (...payloads: any[]) => any
  }
  mapMutations<T extends { [key: string]: keyof M }> (obj: T): {
    [I in keyof T]: M[T[I]]
  }
  mapMutations<T extends { [key: string]: string }> (obj: T): {
    [I in keyof T]: (...payloads: any[]) => any
  }

  mapActions<K extends keyof A> (maps: K[]): Pick<A, K>
  mapActions (depPath: string, maps: string[]): {
    [key: string]: (...payloads: any[]) => any
  }
  mapActions<T extends { [key: string]: keyof A }> (obj: T): {
    [I in keyof T]: A[T[I]]
  }
  mapActions<T extends { [key: string]: string }> (obj: T): {
    [I in keyof T]: (...payloads: any[]) => any
  }

}


export function createStoreWithThis<S = {}, G = {}, M extends MutationsAndActionsWithThis = {}, A extends MutationsAndActionsWithThis = {}, D extends Deps = {}> (option: StoreOptWithThis<S, G, M, A, D>): StoreWithThis<S, G, M, A, D>


export function injectMixins (mixins: object | Array<object>, type?: 'app' | 'page' | 'component'): void


declare class Watcher {
  constructor (context: any, expr: string | (() => any), handler: WatchHandler | WatchOptWithHandler, options?: WatchOpt)

  getValue (): any

  update (): void

  run (): void

  destroy (): void
}

export function watch (expr: string | (() => any), handler: WatchHandler | WatchOptWithHandler, options?: WatchOpt): () => void

type SupportedPlantforms = 'wx' | 'ali' | 'qq' | 'tt' | 'swan'

interface ConvertRule {
  lifecycle?: object
  lifecycleTemplate?: SupportedPlantforms
  lifecycleProxyMap?: object
  pageMode?: 'blend' | ''
  support?: boolean
  convert?: (...args: any[]) => any
}

interface MpxConfig {
  useStrictDiff: Boolean,
  ignoreRenderError: Boolean
}

export function setConvertRule (rule: ConvertRule): void

export function toPureObject (source: any): any

export function extendObservable<A extends Object, B extends Object> (target: A, properties: B): A & B

export interface Mpx {
  createComponent: typeof createComponent
  createPage: typeof createPage
  createApp: typeof createApp
  createStore: typeof createStore
  createStoreWithThis: typeof createStoreWithThis
  getMixin: typeof getMixin
  getComputed: typeof getComputed
  mixin: typeof injectMixins
  injectMixins: typeof injectMixins
  observable: typeof observable
  toPureObject: typeof toPureObject
  extendObservable: typeof extendObservable

  watch: typeof watch

  use (plugin: ((...args: any) => any) | { install: (...args: any) => any, [key: string]: any }, ...rest: any): Mpx

  set: typeof set

  remove: typeof remove

  setConvertRule: typeof setConvertRule

  config: MpxConfig
}

type GetFunctionKey<T> = {
  [K in keyof T]: T[K] extends (...args: any) => any ? K : never
}[keyof T]

declare let mpx: Mpx & Pick<WechatMiniprogram.Wx, GetFunctionKey<WechatMiniprogram.Wx>>

export default mpx
