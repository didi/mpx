// @ts-ignore
import { Mpx } from '@mpxjs/core'

type AddPromise<W> = {
  [K in keyof W]: W[K] extends (...args: any) => any
    ? Parameters<W[K]> extends [{ success?: (res: infer R) => any }?, ...any[]]
      ? (...args: Parameters<W[K]>) => ReturnType<W[K]> & Promise<R>
      : W[K]
    : W[K]
}

type AddParam<O, V extends (...args: any) => any> =
  Parameters<V> extends [{ success?: (res: infer R) => any }, ...any[]]
    ? (options: O) => ReturnType<V> & Promise<R>
    : (options: O) => ReturnType<V>
// @ts-ignore
type PickApiValue<T extends keyof WechatMiniprogram.Wx> = Pick<WechatMiniprogram.Wx, T>[T]
// @ts-ignore
interface GetLocationInterface extends WechatMiniprogram.GetLocationOption {
  aliType?: number
}
// @ts-ignore
interface RequestPaymentInterface extends WechatMiniprogram.RequestPaymentOption {
  tradeNO?: string
}

declare module '@mpxjs/core' {
  // @ts-ignore
  interface Mpx extends AddPromise<WechatMiniprogram.Wx> {
    getLocation: AddParam<GetLocationInterface, PickApiValue<'getLocation'>>
    requestPayment: AddParam<RequestPaymentInterface, PickApiValue<'requestPayment'>>
  }
}

declare const install: (...args: any) => any

export default install
