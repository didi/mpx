// Type definitions for @mpxjs/core
// Project: https://github.com/didi/mpx
// Definitions by: hiyuki <https://github.com/hiyuki>
// TypeScript Version: 3.1

/// <reference types="@types/weixin-app" />

export let createApp: typeof App

type Computed<T> = {
  [K in keyof T]: T[K] extends () => infer R ? R : T[K]
}

type Get<T, K extends keyof T> = T[K]

type Omit<T, K> = Pick<T, Exclude<keyof T, K>>




type Component<D, P, C, B extends Array<wx.Behavior<{}, {}, {}> | string> = []> =
  Omit<wx.Component<D, P, B>, 'data'> &
  Get<wx.Component<D, P, B>, 'data'> &
  {
    data: D &
      wx.UnboxBehaviorsData<B> &
      {
        [key in keyof (P & wx.UnboxBehaviorsProps<B>)]: wx.PropValueType<(P & wx.UnboxBehaviorsProps<B>)[key]>
      }
  }

interface PageOptions extends wx.PageOptions {

}


export function f();
