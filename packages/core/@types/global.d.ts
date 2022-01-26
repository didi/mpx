import VueI18n from 'vue-i18n'

// declaration for mpx mode
declare let __mpx_mode__: 'wx' | 'ali' | 'swan' | 'qq' | 'tt' | 'web' | 'dd' | 'qa' | 'jd'

// declaration for mpx env
declare let __mpx_env__: string

// Wildcard module declarations for ?resolve case
declare module '*?resolve' {
  const resourcePath: string
  export default resourcePath
}

declare module 'vue-i18n' {
  export default interface VueI18n {
    mergeMessages(messages: {[index: string]:VueI18n.LocaleMessageObject}): void;
  }
}