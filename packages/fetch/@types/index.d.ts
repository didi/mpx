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

interface TestOption {
  url?: string
  protocal?: string
  host?: string
  port?: string
  path?: string
  params?: Record<string, any>
  data?: Record<string, any>
  header?: Record<string, any>
  method?: 'OPTIONS' | 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'TRACE' | 'CONNECT'
  custom?: (...args: any[]) => boolean
}

interface ProxyResultOption extends TestOption {
  custom?: (...args: any[]) => any
}

interface ProxyOption {
  test: TestOption
  proxy: ProxyResultOption
  waterfall: boolean
}

interface MockOption {
  test: TestOption
  mock: (...args: any[]) => any
}

// @ts-ignore
type fetchT = <T>(option: fetchOption, priority?: 'normal' | 'low') => Promise<WechatMiniprogram.RequestSuccessCallbackResult<T> & { requestConfig: fetchOption }>
type addLowPriorityWhiteListT = (rules: string | RegExp | Array<string | RegExp>) => void
type createT = (option?: CreateOption) => xfetch
type setProxyT = (option: ProxyOption | Array<ProxyOption>) => void
type setMockT = (option: MockOption | Array<MockOption>) => void

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
  setProxy: setProxyT
  getProxy: () => ProxyOption | Array<ProxyOption>
  clearProxy: () => void
  setMock: setMockT
  getMock: () => MockOption | Array<MockOption>
  clearMock: () => void
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
