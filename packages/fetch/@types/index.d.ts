interface CancelTokenClass {
  new (...args: any): {
    token: Promise<any>
    exec (msg?: any): Promise<any>
  }
}

interface PreCacheOption<T> {
  enable: boolean
  ignorePreParamKeys?: string[]
  equals?: (selfConfig: any, cacheConfig: any) => boolean
  cacheInvalidationTime?: number
  onUpdate?: (response: T) => void
}

export interface fetchOption<T> extends WechatMiniprogram.RequestOption {
  params?: object
  cancelToken?: InstanceType<CancelTokenClass>['token']
  emulateJSON?: boolean
  usePre?: PreCacheOption<T>
}

interface CreateOption {
  limit?: number
  delay?: number
  ratio?: number
}

type fetchT = <T>(option: fetchOption<T>, priority?: 'normal' | 'low') => Promise<WechatMiniprogram.RequestSuccessCallbackResult<T> & { requestConfig: fetchOption<T> }>
type addLowPriorityWhiteListT = (rules: string | RegExp | Array<string | RegExp>) => void
type createT = (option?: CreateOption) => xfetch

export interface InterceptorsRR {
  use: (fulfilled: (...args: any[]) => any, rejected?: (...args: any[]) => any) => (...args: any[]) => any
}

export interface Interceptors {
  request: InterceptorsRR
  response: InterceptorsRR
}

export interface xfetch {
  fetch: fetchT
  addLowPriorityWhiteList: addLowPriorityWhiteListT
  CancelToken: CancelTokenClass
  create: createT
  interceptors: Interceptors
}

declare module '@mpxjs/core' {
  interface Mpx {
    xfetch: xfetch
  }

  interface MpxComponentIns {
    $xfetch: xfetch
  }
}

interface XFetchClass {
  new (option?: CreateOption): {
    create: createT
    addLowPriorityWhiteList: addLowPriorityWhiteListT
    fetch: fetchT
    lock: () => void
    unlock: () => void
  }
}

declare const mpxFetch: {
  install: (...args: any) => any,
  XFetch: XFetchClass
}

export const XFetch: XFetchClass

export const CancelToken: CancelTokenClass

export default mpxFetch
