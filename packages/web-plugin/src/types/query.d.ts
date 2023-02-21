import 'loader-utils'
declare module 'loader-utils' {
  export interface OptionObject {
    vue?: boolean
    mpx?: boolean
    app?: boolean
    page?: boolean
    component?: boolean
    resolve?: boolean
    src?: string
    type?:
      | 'script'
      | 'template'
      | 'style'
      | 'custom'
      | 'global'
      | 'main'
      | 'globalDefine'
      | 'hot'
    index?: string
    lang?: string
    raw?: string
    componentId?: string
    async?: boolean
    root?: string
    outputPath?: string
    mpxStyleOptions?: string
    isPage?: boolean
    isComponent?: boolean
    isApp?: boolean
    mode?: string
    packageRoot?: string
  }
}
