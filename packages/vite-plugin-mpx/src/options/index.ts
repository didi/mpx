import { ViteDevServer } from 'vite'
import { FilterPattern } from '@rollup/pluginutils'

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
  autoVirtualHostRules?: Record<string, unknown>
  forceDisableInject?: boolean
  forceDisableProxyCtor?: boolean
  transMpxRules?: Record<string, () => boolean>
  defs?: Record<string, unknown>
  modeRules?: Record<string, unknown>
  generateBuildMap?: false
  attributes?: string[]
  externals?: string[] | RegExp[]
  projectRoot?: string
  forceUsePageCtor?: boolean
  postcssInlineConfig?: Record<string, unknown>
  transRpxRules?: null
  auditResource?: boolean
  decodeHTMLText?: boolean
  nativeOptions?: Record<string, unknown>
  i18n?: Record<string, string> | null
  checkUsingComponents?: boolean
  reportSize?: boolean | null
  pathHashMode?:
    | 'absolute'
    | 'relative'
    | ((resourcePath: string, projectRoot: string) => string)
  forceDisableBuiltInLoader?: boolean
  useRelativePath?: boolean
  subpackageModulesRules?: Record<string, unknown>
  forceMainPackageRules?: Record<string, unknown>
  forceProxyEventRules?: Record<string, unknown>
  miniNpmPackages?: string[]
  fileConditionRules?: string | RegExp | (string | RegExp)[]
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
  rawOptions.resolveMode = rawOptions.resolveMode || 'webpack'
  rawOptions.writeMode = rawOptions.writeMode || 'changed'
  rawOptions.autoScopeRules = rawOptions.autoScopeRules || {}
  rawOptions.autoVirtualHostRules = rawOptions.autoVirtualHostRules || {}
  rawOptions.forceDisableInject = rawOptions.forceDisableInject || false
  rawOptions.forceDisableProxyCtor = rawOptions.forceDisableProxyCtor || false
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
  rawOptions.generateBuildMap = rawOptions.generateBuildMap || false
  rawOptions.attributes = rawOptions.attributes || []
  rawOptions.externals = (rawOptions.externals || []).map((external) => {
    return typeof external === 'string'
      ? externalsMap[external] || external
      : external
  })
  rawOptions.projectRoot = rawOptions.projectRoot || process.cwd()
  rawOptions.forceUsePageCtor = rawOptions.forceUsePageCtor || false
  rawOptions.postcssInlineConfig = rawOptions.postcssInlineConfig || {}
  rawOptions.transRpxRules = rawOptions.transRpxRules || null
  rawOptions.auditResource = rawOptions.auditResource || false
  rawOptions.decodeHTMLText = rawOptions.decodeHTMLText || false
  rawOptions.nativeOptions = {
    cssLangs: ['css', 'less', 'stylus', 'scss', 'sass'],
    ...rawOptions.nativeOptions
  }
  rawOptions.i18n = rawOptions.i18n || null
  rawOptions.checkUsingComponents = rawOptions.checkUsingComponents || false
  rawOptions.reportSize = rawOptions.reportSize || null
  rawOptions.pathHashMode = rawOptions.pathHashMode || 'absolute'
  rawOptions.forceDisableBuiltInLoader =
    rawOptions.forceDisableBuiltInLoader || false
  rawOptions.useRelativePath = rawOptions.useRelativePath || false
  rawOptions.subpackageModulesRules = rawOptions.subpackageModulesRules || {}
  rawOptions.forceMainPackageRules = rawOptions.forceMainPackageRules || {}
  rawOptions.forceProxyEventRules = rawOptions.forceProxyEventRules || {}
  rawOptions.miniNpmPackages = rawOptions.miniNpmPackages || []
  rawOptions.fileConditionRules = rawOptions.fileConditionRules || [/\.mpx/]
  const options: ResolvedOptions = {
    ...(rawOptions as Required<Options>),
    isProduction: process.env.NODE_ENV === 'production',
    root: ''
  }
  return options
}
