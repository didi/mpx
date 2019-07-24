// Type definitions for @mpxjs/core
// Project: https://github.com/didi/mpx
// Definitions by: hiyuki <https://github.com/hiyuki>
// TypeScript Version: 3.1

/// <reference types="@types/weixin-app" />

export let createApp: typeof App

interface Computed {
  [key: string]: () => any
}

interface Methods {
  [key: string]: (...args: any[]) => any
}

interface WatchOpt {
  handler: (val: any, oldVal?: any) => any
  immediate?: boolean
  immediateAsync?: boolean
  deep?: boolean
  sync?: boolean
}

interface Watch {
  [key: string]: (val: any, oldVal?: any) => any | WatchOpt
}

type GetComputedType<T> = {
  [K in keyof T]: T[K] extends () => infer R ? R : T[K]
}

type GetPropsType<T> = {
  [K in keyof T]: wx.PropValueType<T[K]>
}

type UnionToIntersection<U> = (U extends any
  ? (k: U) => void
  : never) extends ((k: infer I) => void)
  ? I
  : never;

type ArrayType<T extends any[]> = T extends Array<infer R> ? R : never;

type Get<T, K extends keyof T> = T[K]

type Omit<T, K> = Pick<T, Exclude<keyof T, K>>

interface Mixin<D, P, C, M> {
  data?: D
  properties?: P
  computed?: C
  methods?: M

  [index: string]: any
}

interface ComponentOpt<D, P, C, M, Mi extends Array<Mixin<{}, {}, {}, {}>>> {
  data?: D
  properties?: P
  computed?: C
  methods?: M
  mixins?: Mi

  [index: string]: any
}

export function getMixin<D, P, C, M, Mi extends Array<Mixin<{}, {}, {}, {}>>>(opt: ComponentOpt<D, P, C, M, Mi>): {
  data?: D & UnboxMixinsField<Mi, 'data'>
  properties?: P & UnboxMixinsField<Mi, 'properties'>
  computed?: C & UnboxMixinsField<Mi, 'computed'>
  methods?: M & UnboxMixinsField<Mi, 'methods'>
  [index: string]: any
}

type UnboxMixinField<T extends Mixin<{}, {}, {}, {}>, F> = F extends keyof T ? T[F] : {}

type UnboxMixinsField<Mi extends Array<Mixin<{}, {}, {}, {}>>, F> = UnionToIntersection<UnboxMixinField<ArrayType<Mi>, F>>

type ThisTypedComponentOpt<D, P, C, M, Mi extends Array<Mixin<{}, {}, {}, {}>>> =
  ComponentOpt<D, P, C, M, Mi>
  & ThisType<ComponentIns<D, Readonly<P>, C, M, Mi>>

type MergeMixins<D, P, C, M, Mi extends Array<Mixin<{}, {}, {}, {}>>> = {
  data?: D & UnboxMixinsField<Mi, 'data'>
  properties?: P & UnboxMixinsField<Mi, 'properties'>
  computed?: C & UnboxMixinsField<Mi, 'computed'>
  methods?: M & UnboxMixinsField<Mi, 'methods'>
  [index: string]: any
}

type ComponentIns<D, P, C, M, Mi extends Array<Mixin<{}, {}, {}, {}>>> = GetComponentIns<MergeMixins<D, P, C, M, Mi>>

type GetComponentIns<T extends Mixin<{}, {}, {}, {}>> =
  T['data']
  & T['methods']
  & GetComputedType<T['computed']>
  & GetPropsType<T['properties']>
  & {

} & object





