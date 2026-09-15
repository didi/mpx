declare let __mpx_mode__: 'wx' | 'ali' | 'swan' | 'qq' | 'tt' | 'web' | 'dd' | 'qa' | 'jd' | 'android' | 'ios' | 'harmony'
// 性能探针开关（DefinePlugin 注入）。详见 packages/webpack-plugin/lib/utils/normalize-perf-options.js
declare const __mpx_perf__: boolean
declare const __mpx_perf_framework__: boolean
declare const __mpx_perf_user__: boolean
declare module '@mpxjs/utils' {
  export function isEmptyObject (obj: Object): boolean
  export function isFunction (fn: unknown): boolean
  export function isNumber (num: unknown): boolean
  export function hasOwn (obj: Object, key: string): boolean
  export function noop (...arg: any): void
  export function diffAndCloneA<A, B> (a: A, b?: B): {
    clone: A
    diff: boolean
    diffData: Object | null
  }
  export function shallowEqual (a: unknown, b: unknown): boolean
  export function isObject (value): value is Object
  export function error (msg: string, location?: string, e?: any): void
  export function warn (msg: string, location?: string, e?: any): void
  export function collectDataset (props: Record<string, any>, needParse?: boolean): Record<string, any>
  export function getFocusedNavigation (): {
    insets: {
      top: number
      bottom: number
      left: number
      right: number
    },
    setOptions: (params: Record<string, any>) => void,
    addListener: (eventName: string, callback: (e: Event) => void) => void
    removeListener: (eventName: string, callback: (e: Event) => void) => void
    dispatch: (eventName: string) => void
    pageId: number
    layout: {
      x: number
      y: number
      width: number
      height: number
    },
    setOptions: (params: Record<string, any>) => void
  } | undefined
  export function dash2hump (str: string): string
}

declare let global: {
  __formatValue (value: string): string | number
} & Record<string, any>

declare let mpxGlobal: Record<string, any>

declare module '@react-navigation/native' {
   export function useNavigation (): Record<string, any>
   export function usePreventRemove(
    enabled: boolean,
    callback: (e: { data: { action: any } }) => void
  ): void;
  export interface PreventRemoveEvent {
    data: {
      action: NavigationAction;
      route: {
        key: string;
        name: string;
        params?: unknown;
      };
    };
    preventDefault(): void;
  }
}

declare module '*.png'
