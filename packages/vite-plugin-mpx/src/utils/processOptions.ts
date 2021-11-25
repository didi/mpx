import { ResolvedOptions, Options } from '../index'

const externalsMap: Record<string, RegExp> = {
  weui: /^weui-miniprogram/
}

export default function processOptions(rawOptions: Options): ResolvedOptions {
  rawOptions.include = rawOptions.include || /\.mpx$/
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
  rawOptions.defs = Object.assign({}, rawOptions.defs, {
    __mpx_mode__: rawOptions.mode,
    __mpx_src_mode__: rawOptions.srcMode,
    __mpx_env__: rawOptions.env
  })
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
  rawOptions.nativeOptions = Object.assign(
    {
      cssLangs: ['css', 'less', 'stylus', 'scss', 'sass']
    },
    rawOptions.nativeOptions
  )
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
  rawOptions.fileConditionRules = rawOptions.fileConditionRules || {
    include: () => true
  }
  const options: ResolvedOptions = {
    ...(rawOptions as Required<Options>),
    sourceMap: true,
    root: '',
    isProduction: process.env.NODE_ENV === 'production'
  }
  return options
}
