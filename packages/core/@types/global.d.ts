// declaration for mpx mode
declare let __mpx_mode__: 'wx' | 'ali' | 'swan' | 'qq' | 'tt' | 'web' | 'dd' | 'qa' | 'jd' | 'android' | 'ios' | 'harmony'

// declaration for mpx env
declare let __mpx_env__: string

declare const Mixin: WechatMiniprogram.Behavior.Constructor

// Wildcard module declarations for ?resolve case
declare module '*?resolve' {
  const resourcePath: string
  export default resourcePath
}
