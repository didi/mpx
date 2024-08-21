/* eslint-disable @typescript-eslint/no-explicit-any */
export interface SFCDescriptor {
  source: string
  filename: string
  template: SFCBlock | null
  script: SFCScriptBlock | null
  scriptSetup: SFCScriptBlock | null
  styles: SFCBlock[]
  customBlocks: SFCCustomBlock[]
  cssVars: string[]
  errors: (string | WarningMessage)[]
}

export type WarningMessage = {
  msg: string
  start?: number
  end?: number
}

export interface SFCCustomBlock {
  type: string
  content: string
  attrs: { [key: string]: string | true }
  start: number
  end: number
  src?: string
  map?: RawSourceMap
}

export interface SFCBlock extends SFCCustomBlock {
  lang?: string
  scoped?: boolean
  module?: string | boolean
}

export interface SFCScriptBlock extends SFCBlock {
  type: 'script'
  setup?: string | boolean
  bindings?: any
  imports?: Record<string, ImportBinding>
  /**
   * import('\@babel/types').Statement
   */
  scriptAst?: any[]
  /**
   * import('\@babel/types').Statement
   */
  scriptSetupAst?: any[]
}

export interface RawSourceMap extends StartOfSourceMap {
  version: string
  sources: string[]
  names: string[]
  sourcesContent?: string[]
  mappings: string
}

export interface StartOfSourceMap {
  file?: string
  sourceRoot?: string
}

export interface ImportBinding {
  isType: boolean
  imported: string
  source: string
  isFromSetup: boolean
  isUsedInTemplate: boolean
}

export type ASTAttr = {
  name: string
  value: any
  dynamic?: boolean
  start?: number
  end?: number
}
