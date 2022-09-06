import { ViteDevServer, FilterPattern } from 'vite'

export type Mode = 'wx' | 'web' | 'ali' | 'swan'

export interface Options {
  include?: string | RegExp | (string | RegExp)[]
  exclude?: string | RegExp | (string | RegExp)[]
  mode?: Mode
  env?: string
  srcMode?: Mode
  externalClasses?: string[]
  resolveMode?: 'webpack' | 'native'
  writeMode?: 'changed' | 'full' | null
  autoScopeRules?: {
    include?: FilterPattern
    exclude?: FilterPattern
  }
  transMpxRules?: Record<string, () => boolean>
  defs?: Record<string, unknown>
  modeRules?: Record<string, unknown>
  externals?: string[] | RegExp[]
  projectRoot?: string
  postcssInlineConfig?: Record<string, unknown>
  transRpxRules?: null
  decodeHTMLText?: boolean
  i18n?: Record<string, string> | null
  checkUsingComponents?: boolean
  reportSize?: boolean | null
  pathHashMode?:
    | 'absolute'
    | 'relative'
    | ((resourcePath: string, projectRoot: string) => string)
  fileConditionRules?: Record<string, () => boolean>
  customOutputPath?: Function | null
  webConfig?:Record<string, unknown>
}

export interface ResolvedOptions extends Required<Options> {
  sourceMap?: boolean
  devServer?: ViteDevServer
  root: string
  isProduction: boolean
}

const externalsMap: Record<string, RegExp> = {
  weui: /^weui-miniprogram/
}

export function processOptions(rawOptions: Options): ResolvedOptions {
  rawOptions.include = rawOptions.include || [/\.mpx$/]
  rawOptions.exclude = rawOptions.exclude || []
  rawOptions.mode = rawOptions.mode || 'web'
  rawOptions.env = rawOptions.env || process.env.NODE_ENV || ''
  rawOptions.srcMode = rawOptions.srcMode || 'wx'
  if (rawOptions.mode !== rawOptions.srcMode && rawOptions.srcMode !== 'wx') {
    throw new Error(
      'MpxWebpackPlugin supports srcMode to be "wx" only temporarily!'
    )
  }
  if (rawOptions.mode === 'web' && rawOptions.srcMode !== 'wx') {
    throw new Error(
      'MpxWebpackPlugin supports mode to be "web" only when srcMode is set to "wx"!'
    )
  }
  rawOptions.externalClasses = rawOptions.externalClasses || [
    'custom-class',
    'i-class'
  ]
  rawOptions.writeMode = rawOptions.writeMode || 'changed'
  rawOptions.autoScopeRules = rawOptions.autoScopeRules || {}
  rawOptions.transMpxRules = rawOptions.transMpxRules || {
    include: () => true
  }
  // 通过默认defs配置实现mode及srcMode的注入，简化内部处理逻辑
  rawOptions.defs = {
    ...rawOptions.defs,
    __mpx_mode__: rawOptions.mode,
    __mpx_src_mode__: rawOptions.srcMode,
    __mpx_env__: rawOptions.env
  }
  // 批量指定源码mode
  rawOptions.modeRules = rawOptions.modeRules || {}
  rawOptions.externals = (rawOptions.externals || []).map((external) => {
    return typeof external === 'string'
      ? externalsMap[external] || external
      : external
  })
  rawOptions.projectRoot = rawOptions.projectRoot || process.cwd()
  rawOptions.postcssInlineConfig = rawOptions.postcssInlineConfig || {}
  rawOptions.transRpxRules = rawOptions.transRpxRules || null
  rawOptions.decodeHTMLText = rawOptions.decodeHTMLText || false
  rawOptions.i18n = rawOptions.i18n || null
  rawOptions.checkUsingComponents = rawOptions.checkUsingComponents || false
  rawOptions.pathHashMode = rawOptions.pathHashMode || 'absolute'
  rawOptions.fileConditionRules = rawOptions.fileConditionRules || {
    include: () => true
  }
  rawOptions.customOutputPath = rawOptions.customOutputPath || null
  rawOptions.webConfig = rawOptions.webConfig || {}
  const options: ResolvedOptions = {
    ...(rawOptions as Required<Options>),
    isProduction: process.env.NODE_ENV === 'production',
    root: ''
  }
  return options
}
