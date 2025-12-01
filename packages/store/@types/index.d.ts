import type { ComputedRef } from '@mpxjs/core'

type UnboxDepField<D, F> = F extends keyof D ? D[F] : {}

type GetReturnOrSelf<T> = T extends (...args: any)=> infer R ? R : T

export interface compContext {
  [key: string]: any
}

interface Deps {
  [key: string]: Store | StoreWithThis
}

type UnboxDepsField<D extends Deps, F> = string extends keyof D ? {} : {
  [K in keyof D]: UnboxDepField<D[K], F>
}

type getMutation<M> = M extends (state: any, ...payload: infer P) => infer R ? (...payload: P) => R : never

type getAction<A> = A extends (context: object, ...payload: infer P) => infer R ? (...payload: P) => R : never

type Mutations<S> = {
  [key: string]: (this: void, state: S, ...payload: any[]) => any
}

interface Getters<S> {
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

type GetGetters<G> = {
  readonly [K in keyof G]: G[K] extends (state: any, getters: any, globalState: any) => infer R ? R : G[K]
}

type GetMutations<M> = {
  [K in keyof M]: getMutation<M[K]>
}

type GetActions<A> = {
  [K in keyof A]: getAction<A[K]>
}

type GetDispatch<A, D> = keyof D extends never ? (<T extends keyof A>(type: T, ...payload: A[T] extends (context: any, ...payload: infer P) => any ? P : never) => A[T] extends (context: any, ...payload: any[]) => infer R ? R : never) : ((type: string, ...payload: any[]) => any)

type GetCommit<M, D> = keyof D extends never ? (<T extends keyof M>(type: T, ...payload: M[T] extends (state: any, ...payload: infer P) => any ? P : never) => M[T] extends (state: any, ...payload: any[]) => infer R ? R : never) : ((type: string, ...payload: any[]) => any)

// do not exist in tip
declare const DEPS_SYMBOL: unique symbol
declare const STATE_SYMBOL: unique symbol
declare const GETTERS_SYMBOL: unique symbol

type DepsSymbol = typeof DEPS_SYMBOL
type StateSymbol = typeof STATE_SYMBOL
type GettersSymbol = typeof GETTERS_SYMBOL

export interface Store<S = {}, G = {}, M = {}, A = {}, D extends Deps = {}> {

  [DEPS_SYMBOL]: D
  [STATE_SYMBOL]: S
  [GETTERS_SYMBOL]: GetGetters<G>

  state: S & UnboxDepsField<D, 'state'>
  getters: GetGetters<G> & UnboxDepsField<D, 'getters'>
  mutations: GetMutations<M> & UnboxDepsField<D, 'mutations'>
  actions: GetActions<A> & UnboxDepsField<D, 'actions'>

  dispatch: GetDispatch<A, D>

  commit: GetCommit<M, D>

  mapState<K extends keyof S>(maps: K[]): {
    [I in K]: () => S[I]
  }
  mapState(depPath: string, maps: string[]): object

  // mapState support object
  mapState<T extends { [key: string]: keyof GetAllMapKeys<S, D, StateSymbol> }>(obj: T): {
    [I in keyof T]: () => GetAllMapKeys<S, D, StateSymbol>[T[I]]
  }

  mapGetters<K extends keyof G>(maps: K[]): {
    [I in K]: () => GetGetters<G>[I]
  }
  mapGetters(depPath: string, maps: string[]): {
    [key: string]: () => any
  }

  mapMutations<K extends keyof M>(maps: K[]): Pick<GetMutations<M>, K>
  mapMutations(depPath: string, maps: string[]): {
    [key: string]: (...payloads: any[]) => any
  }

  mapActions<K extends keyof A>(maps: K[]): Pick<GetActions<A>, K>
  mapActions(depPath: string, maps: string[]): {
    [key: string]: (...payloads: any[]) => any
  }

  // 组合式 API
  mapStateToRefs<K extends keyof S>(maps: K[]): {
    [I in K]: ComputedRef<S[I]>
  }
  mapStateToRefs(depPath: string, maps: string[]): object

  // mapState support object
  mapStateToRefs<T extends { [key: string]: keyof GetAllMapKeys<S, D, StateSymbol> }>(obj: T): {
    [I in keyof T]: ComputedRef<GetAllMapKeys<S, D, StateSymbol>[T[I]]>
  }

  mapGettersToRefs<K extends keyof G>(maps: K[]): {
    [I in K]: ComputedRef<GetGetters<G>[I]>
  }
  mapGettersToRefs(depPath: string, maps: string[]): {
    [key: string]: ComputedRef<any>
  }

  // 下面是新增的异步store的接口类型
  mapStateToInstance<K extends keyof S>(maps: K[], context: compContext): void
  mapStateToInstance(depPath: string, maps: string[], context: compContext): void

  // mapState support object
  mapStateToInstance<T extends { [key: string]: keyof GetAllMapKeys<S, D, StateSymbol> }>(obj: T, context: compContext): void

  mapGettersToInstance<K extends keyof G>(maps: K[], context: compContext): void
  mapGettersToInstance(depPath: string, maps: string[], context: compContext): void

  mapMutationsToInstance<K extends keyof M>(maps: K[], context: compContext): Pick<GetMutations<M>, K>
  mapMutationsToInstance(depPath: string, maps: string[], context: compContext): void

  mapActionsToInstance<K extends keyof A>(maps: K[], context: compContext): Pick<GetActions<A>, K>
  mapActionsToInstance(depPath: string, maps: string[], context: compContext): void
}

export type GetComputedType<T> = {
  [K in keyof T]: T[K] extends { get: (...args: any[]) => infer R }
    ? R
    : T[K] extends (...args: any[]) => infer R
    ? R
    : never
}

interface MutationsAndActionsWithThis {
  [key: string]: (...payload: any[]) => any
}

type UnionToIntersection<U> = (U extends any
  ? (k: U) => void
  : never) extends ((k: infer I) => void)
  ? I
  : never;

export interface mapStateFunctionType<S, G> {
  [key: string]: (state: S, getter: G) => any
}
interface DeeperMutationsAndActions {
  [key: string]: ((...payload: any[]) => any) | MutationsAndActionsWithThis
}

interface DeeperStateAndGetters {
  [key: string]: any | DeeperStateAndGetters
}

/**
 * remove compatible code in Mpx.
 * if you need using createStoreWithThis mix with createStore
 * you can add a global define file
 * use Declaration Merging(https://www.typescriptlang.org/docs/handbook/declaration-merging.html) on CompatibleDispatch:
 * @example
 * declare module '@mpxjs/core' {
 *  interface CompatibleDispatch {
 *    dispatch(type: string, ...payload: any[]): any
 *    commit(type: string, ...payload: any[]): any
 *  }
 * }
 */
export interface CompatibleDispatch {
  // dispatch(type: string, ...payload: any[]): any
  // commit(type: string, ...payload: any[]): any
}

// Store Type Bindings
type StringKeyof<T> = Exclude<keyof T, symbol>

type CombineStringKey<H extends string | number, L extends string | number> = H extends '' ? `${L}` : `${H}.${L}`

type GetActionsKey<A, P extends string | number = ''> = UnionToIntersection<{
  [K in StringKeyof<A>]: {
    [RK in CombineStringKey<P, K>]: A[K] extends DeeperMutationsAndActions ? GetActionsKey<A[K], RK> : Record<RK, A[K]>
  }[CombineStringKey<P, K>]
}[StringKeyof<A>]> // {actA: () => void, storeB.actB: () => void}

type GetStateAndGettersKey<D extends Deps, DK extends keyof D, T extends StateSymbol | GettersSymbol, P extends string | number = ''> = UnionToIntersection<{
  [K in StringKeyof<D[DK][T]>]: {
    [RK in CombineStringKey<P, K>]: D[DK][T][K]
  }
}[StringKeyof<D[DK][T]>] | {
  [K in StringKeyof<D[DK][DepsSymbol]>]: GetStateAndGettersKey<D[DK][DepsSymbol], K, T, CombineStringKey<P, K>>
}[StringKeyof<D[DK][DepsSymbol]>]>

// type GetStateAndGettersKey<S, P extends string | number = ''> = UnionToIntersection<{
//   [K in StringKeyof<S>]: {
//     [RK in CombineStringKey<P, K>]: S[K] extends DeeperStateAndGetters ? GetStateAndGettersKey<S[K], RK> : Record<RK, S[K]>
//   }[CombineStringKey<P, K>]
// }[StringKeyof<S>]> // {stateA: any, storeB.stateB: any}

type GetAllDepsType<A, D extends Deps, AK extends StateSymbol | GettersSymbol | 'actions' | 'mutations'> = {
  [K in StringKeyof<A>]: A[K]
} & UnionToIntersection<{
  [K in StringKeyof<D>]: AK extends 'actions' | 'mutations' ? {
    [P in keyof GetActionsKey<D[K][AK], K>]: GetActionsKey<D[K][AK], K>[P]
  } : AK extends StateSymbol | GettersSymbol ? { // state, getters
    [P in keyof GetStateAndGettersKey<D, K, AK, K>]: GetStateAndGettersKey<D, K, AK, K>[P]
    // [P in keyof GetStateAndGettersKey<D[K][AK], K>]: GetStateAndGettersKey<D[K][AK], K>[P]
  } : {}
}[StringKeyof<D>]>
type GetDispatchAndCommitWithThis<A, D extends Deps, AK extends 'actions' | 'mutations'> = (<T extends keyof GetAllDepsType<A, D, AK>>(type: T, ...payload: GetAllDepsType<A, D, AK>[T] extends (...payload: infer P) => any ? P : never) => GetAllDepsType<A, D, AK>[T] extends (...payload: any[]) => infer R ? R : never)

// type GetAllMapKeys<S, D extends Deps, SK extends 'state' | 'getters'> = GetAllDepsType<S, D, SK> & GetStateAndGettersKey<S>
type GetAllMapKeys<S, D extends Deps, SK extends StateSymbol | GettersSymbol> = GetAllDepsType<S, D, SK> // 关闭对state、getters本身传入对象的深层次推导，因为过深的递归会导致ts推导直接挂掉

interface StoreOptWithThis<S, G, M, A, D extends Deps> {
  state?: S
  getters?: G & ThisType<{ state: S & UnboxDepsField<D, 'state'>, getters: GetComputedType<G> & UnboxDepsField<D, 'getters'>, rootState: any }>
  mutations?: M & ThisType<{ state: S & UnboxDepsField<D, 'state'> }>
  actions?: A & ThisType<{
    rootState: any,
    state: S & UnboxDepsField<D, 'state'>,
    getters: GetComputedType<G> & UnboxDepsField<D, 'getters'>,
    dispatch: GetDispatchAndCommitWithThis<A, D, 'actions'>,
    commit: GetDispatchAndCommitWithThis<M, D, 'mutations'>
  } & CompatibleDispatch>
  deps?: D
  modules?: Record<string, StoreOptWithThis<{}, {}, {}, {}, {}>>
}

export interface IStoreWithThis<S = {}, G = {}, M = {}, A = {}, D extends Deps = {}> {

  [DEPS_SYMBOL]: D
  [STATE_SYMBOL]: S
  [GETTERS_SYMBOL]: GetComputedType<G>

  state: S & UnboxDepsField<D, 'state'>
  getters: GetComputedType<G> & UnboxDepsField<D, 'getters'>
  mutations: M & UnboxDepsField<D, 'mutations'>
  actions: A & UnboxDepsField<D, 'actions'>

  dispatch: GetDispatchAndCommitWithThis<A, D, 'actions'>

  commit: GetDispatchAndCommitWithThis<M, D, 'mutations'>

  mapState<K extends keyof S>(maps: K[]): {
    [I in K]: () => S[I]
  }
  mapState<T extends string, P extends string>(depPath: P, maps: readonly T[]): {
    [K in T]: () => (CombineStringKey<P, K> extends keyof GetAllMapKeys<S, D, StateSymbol> ? GetAllMapKeys<S, D, StateSymbol>[CombineStringKey<P, K>] : any)
  }
  mapState<T extends mapStateFunctionType<S & UnboxDepsField<D, 'state'>, GetComputedType<G> & UnboxDepsField<D, 'getters'>>>(obj: ThisType<any> & T): {
    [I in keyof T]: () => ReturnType<T[I]>
  }
  // Support chain derivation
  mapState<T extends { [key: string]: keyof GetAllMapKeys<S, D, StateSymbol> }>(obj: T): {
    [I in keyof T]: () => GetAllMapKeys<S, D, StateSymbol>[T[I]]
  }
  mapState<T extends { [key: string]: keyof S }>(obj: T): {
    [I in keyof T]: () => S[T[I]]
  }
  mapState<T extends { [key: string]: string }>(obj: T): {
    [I in keyof T]: (...payloads: any[]) => any
  }

  mapGetters<K extends keyof G>(maps: K[]): Pick<G, K>
  mapGetters<T extends string, P extends string>(depPath: P, maps: readonly T[]): {
    // use GetComputedType to get getters' returns
    [K in T]: () => (CombineStringKey<P, K> extends keyof GetAllMapKeys<GetComputedType<G>, D, GettersSymbol> ? GetAllMapKeys<GetComputedType<G>, D, GettersSymbol>[CombineStringKey<P, K>] : any)
  }
  // Support chain derivation
  mapGetters<T extends { [key: string]: keyof GetAllMapKeys<GetComputedType<G>, D, GettersSymbol> }>(obj: T): {
    [I in keyof T]: () => GetAllMapKeys<GetComputedType<G>, D, GettersSymbol>[T[I]]
  }
  mapGetters<T extends { [key: string]: keyof G }>(obj: T): {
    [I in keyof T]: G[T[I]]
  }
  // When importing js in ts file, use this method to be compatible
  mapGetters<T extends { [key: string]: string }>(obj: T): {
    [I in keyof T]: (...payloads: any[]) => any
  }

  mapMutations<K extends keyof M>(maps: K[]): Pick<M, K>
  mapMutations<T extends string, P extends string>(depPath: P, maps: readonly T[]): {
    [K in T]: CombineStringKey<P, K> extends keyof GetAllDepsType<M, D, 'mutations'> ? GetAllDepsType<M, D, 'mutations'>[CombineStringKey<P, K>] : (...payloads: any[]) => any
  }
  mapMutations<T extends { [key: string]: keyof M }>(obj: T): {
    [I in keyof T]: M[T[I]]
  }
  mapMutations<T extends { [key: string]: string }>(obj: T): {
    [I in keyof T]: (...payloads: any[]) => any
  }

  mapActions<K extends keyof A>(maps: K[]): Pick<A, K>
  mapActions<T extends string, P extends string>(depPath: P, maps: readonly T[]): {
    [K in T]: CombineStringKey<P, K> extends keyof GetAllDepsType<A, D, 'actions'> ? GetAllDepsType<A, D, 'actions'>[CombineStringKey<P, K>] : (...payloads: any[]) => any
  }
  mapActions<T extends { [key: string]: keyof A }>(obj: T): {
    [I in keyof T]: A[T[I]]
  }
  mapActions<T extends { [key: string]: string }>(obj: T): {
    [I in keyof T]: (...payloads: any[]) => any
  }

  // 组合式 API
  mapStateToRefs<K extends keyof S>(maps: K[]): {
    [I in K]: ComputedRef<S[I]>
  }
  mapStateToRefs<T extends string, P extends string>(depPath: P, maps: readonly T[]): {
    [K in T]: ComputedRef<CombineStringKey<P, K> extends keyof GetAllMapKeys<S, D, StateSymbol> ? GetAllMapKeys<S, D, StateSymbol>[CombineStringKey<P, K>] : any>
  }
  mapStateToRefs<T extends mapStateFunctionType<S & UnboxDepsField<D, 'state'>, GetComputedType<G> & UnboxDepsField<D, 'getters'>>>(obj: ThisType<any> & T): {
    [I in keyof T]: ComputedRef<ReturnType<T[I]>>
  }
  // Support chain derivation
  mapStateToRefs<T extends { [key: string]: keyof GetAllMapKeys<S, D, StateSymbol> }>(obj: T): {
    [I in keyof T]: ComputedRef<GetAllMapKeys<S, D, StateSymbol>[T[I]]>
  }
  mapStateToRefs<T extends { [key: string]: keyof S }>(obj: T): {
    [I in keyof T]: ComputedRef<S[T[I]]>
  }
  mapStateToRefs<T extends { [key: string]: string }>(obj: T): {
    [I in keyof T]: ComputedRef<any>
  }

  mapGettersToRefs<K extends keyof G>(maps: K[]): {
    [I in K]: ComputedRef<GetReturnOrSelf<G[I]>>
  }
  mapGettersToRefs<T extends string, P extends string>(depPath: P, maps: readonly T[]): {
    // use GetComputedType to get getters' returns
    [K in T]: ComputedRef<CombineStringKey<P, K> extends keyof GetAllMapKeys<GetComputedType<G>, D, GettersSymbol> ? GetAllMapKeys<GetComputedType<G>, D, GettersSymbol>[CombineStringKey<P, K>] : any>
  }
  // Support chain derivation
  mapGettersToRefs<T extends { [key: string]: keyof GetAllMapKeys<GetComputedType<G>, D, GettersSymbol> }>(obj: T): {
    [I in keyof T]: ComputedRef<GetAllMapKeys<GetComputedType<G>, D, GettersSymbol>[T[I]]>
  }
  mapGettersToRefs<T extends { [key: string]: keyof G }>(obj: T): {
    [I in keyof T]: ComputedRef<GetReturnOrSelf<G[T[I]]>>
  }
  // When importing js in ts file, use this method to be compatible
  mapGettersToRefs<T extends { [key: string]: string }>(obj: T): {
    [I in keyof T]: ComputedRef<any>
  }

  // 异步store api
  mapStateToInstance<K extends keyof S>(maps: K[], context: compContext): void
  mapStateToInstance<T extends string, P extends string>(depPath: P, maps: readonly T[], context: compContext): void
  mapStateToInstance<T extends mapStateFunctionType<S & UnboxDepsField<D, 'state'>, GetComputedType<G> & UnboxDepsField<D, 'getters'>>>(obj: ThisType<any> & T, context: compContext): void
  // Support chain derivation
  mapStateToInstance<T extends { [key: string]: keyof GetAllMapKeys<S, D, StateSymbol> }>(obj: T, context: compContext): void
  mapStateToInstance<T extends { [key: string]: keyof S }>(obj: T, context: compContext): void
  mapStateToInstance<T extends { [key: string]: string }>(obj: T, context: compContext): void

  mapGettersToInstance<K extends keyof G>(maps: K[], context: compContext): void
  mapGettersToInstance<T extends string, P extends string>(depPath: P, maps: readonly T[], context: compContext): void
  // Support chain derivation
  mapGettersToInstance<T extends { [key: string]: keyof GetAllMapKeys<GetComputedType<G>, D, GettersSymbol> }>(obj: T, context: compContext): void
  mapGettersToInstance<T extends { [key: string]: keyof G }>(obj: T, context: compContext): void
  // When importing js in ts file, use this method to be compatible
  mapGettersToInstance<T extends { [key: string]: string }>(obj: T, context: compContext): void

  mapMutationsToInstance<K extends keyof M>(maps: K[], context: compContext): void
  mapMutationsToInstance<T extends string, P extends string>(depPath: P, maps: readonly T[], context: compContext): void
  mapMutationsToInstance<T extends { [key: string]: keyof M }>(obj: T, context: compContext): void
  mapMutationsToInstance<T extends { [key: string]: string }>(obj: T, context: compContext): void

  mapActionsToInstance<K extends keyof A>(maps: K[], context: compContext): void
  mapActionsToInstance<T extends string, P extends string>(depPath: P, maps: readonly T[], context: compContext): void
  mapActionsToInstance<T extends { [key: string]: keyof A }>(obj: T, context: compContext): void
  mapActionsToInstance<T extends { [key: string]: string }>(obj: T, context: compContext): void
}

export type StoreWithThis<S = {}, G = {}, M = {}, A = {}, D extends Deps = {}> = IStoreWithThis<S, G, M, A, D> & CompatibleDispatch

interface StoreOpt<S, G, M, A, D extends Deps> {
  state?: S,
  getters?: G
  mutations?: M,
  actions?: A,
  deps?: D
  modules?: Record<string, StoreOpt<{}, {}, {}, {}, {}>>
}

export function createStore<S, G extends Getters<S>, M extends Mutations<S>, A extends Actions<S, G>, D extends Deps = {}>(option: StoreOpt<S, G, M, A, D>): Store<S, G, M, A, D>

export function createStoreWithThis<S = {}, G = {}, M extends MutationsAndActionsWithThis = {}, A extends MutationsAndActionsWithThis = {}, D extends Deps = {}>(option: StoreOptWithThis<S, G, M, A, D>): StoreWithThis<S, G, M, A, D>

// auxiliary functions
export function createStateWithThis<S = {}>(state: S): S

export function createGettersWithThis<S = {}, D extends Deps = {}, G = {}, OG = {}>(getters: G & ThisType<{ state: S & UnboxDepsField<D, 'state'>, getters: GetComputedType<G & OG> & UnboxDepsField<D, 'getters'>, rootState: any }>, options?: {
  state?: S,
  getters?: OG,
  deps?: D
}): G

export function createMutationsWithThis<S = {}, D extends Deps = {}, M extends MutationsAndActionsWithThis = {}>(mutations: M & ThisType<{ state: S & UnboxDepsField<D, 'state'>, commit: GetDispatchAndCommitWithThis<M, D, 'mutations'> }>, options?: {
  state?: S,
  deps?: D
}): M

export function createActionsWithThis<S = {}, G = {}, M extends MutationsAndActionsWithThis = {}, D extends Deps = {}, A extends MutationsAndActionsWithThis = {}, OA extends MutationsAndActionsWithThis = {}>(actions: A & ThisType<{
  rootState: any,
  state: S & UnboxDepsField<D, 'state'>,
  getters: GetComputedType<G> & UnboxDepsField<D, 'getters'>,
  dispatch: GetDispatchAndCommitWithThis<A & OA, D, 'actions'>,
  commit: GetDispatchAndCommitWithThis<M, D, 'mutations'>
} & CompatibleDispatch>, options?: {
  state?: S,
  getters?: G,
  mutations?: M,
  actions?: OA,
  deps?: D
}): A

// use this to avoid symbol export
export { }
