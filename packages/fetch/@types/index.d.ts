// @ts-ignore
import mpx from '@mpxjs/core'

interface CancelTokenClass {
  new (...args: any): {
    token: Promise<any>
    exec (msg?: any): Promise<any>
  }
}

// @ts-ignore
export interface fetchOption extends WechatMiniprogram.RequestOption {
  params?: object
  cancelToken?: InstanceType<CancelTokenClass>['token']
  emulateJSON?: boolean
}

interface CreateOption {
  limit?: number
  delay?: number
  ratio?: number
}

// @ts-ignore
type fetchT = (option: fetchOption, priority?: 'normal' | 'low') => Promise<WechatMiniprogram.RequestSuccessCallbackResult & { requestConfig: fetchOption }>
type addLowPriorityWhiteListT = (rules: string | RegExp | Array<string | RegExp>) => void
type createT = (option?: CreateOption) => xfetch

export interface xfetch {
  fetch: fetchT,
  addLowPriorityWhiteList: addLowPriorityWhiteListT,
  CancelToken: CancelTokenClass,
  create: createT,
  interceptors: {
    request: {
      use: (fn: (config: any) => any) => void
    },
    response: {
      use: (fn: (config: any) => any) => void
    }
  }
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
