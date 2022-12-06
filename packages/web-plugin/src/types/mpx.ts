export interface Mpx {
  pagesMap: any
  componentsMap: any
  checkUsingComponents?: boolean;
  srcMode?: 'wx' | 'web' | 'ali' | 'swan';
  usingComponents?: Record<string, string>
  currentPackageRoot?: string
  wxsContentMap?: any
  minimize?: boolean
  env?: string
  staticResourcesMap?: Record<string, any>
  externalClasses?: Array<string>,
  mode?: 'wx' | 'web' | 'ali' | 'swan'
  recordResourceMap?(record: {
    resourcePath: string
    resourceType: 'page' | 'component'
    outputPath: string
    packageRoot: string
    recordOnly: boolean
    warn(e: Error): void
    error(e: Error): void
  }): void
  i18n?: Record<string, string> | null
  externals?: (string | RegExp)[]
  projectRoot?: string
  // getOutputPath?: (resourcePath: string, type: ('component' | 'page'), mpx?: any, option?: { ext?: string, conflictPath?: string }) => string
  defs?: Record<string, any>
  transRpxRules?: any,
  webConfig?:  Record<string, unknown>,
  vueContentCache?: Map<any, any>,
  postcssInlineConfig?: Record<string, unknown> | undefined
  // pathHash?: (resourcePath: string) => string
  appTitle?: string
  autoScopeRules?: any
  decodeHTMLText?: boolean
  [k: string]: any
}
