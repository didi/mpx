// declaration for mpx mode
declare let __mpx_mode__: 'wx' | 'ali' | 'swan' | 'qq' | 'tt' | 'web' | 'dd' | 'qa' | 'jd' | 'ks'

// declaration for mpx env
declare let __mpx_env__: string

// Wildcard module declarations for ?resolve case
declare module '*?resolve' {
  const resourcePath: string
  export default resourcePath
}
