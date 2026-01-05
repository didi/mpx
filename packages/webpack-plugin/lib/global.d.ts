import * as webpack from 'webpack'

declare module 'webpack' {
  interface Compilation {
    __mpx__: MpxContext
  }

  interface Compiler {
    __mpx__?: boolean
  }
}

declare global {
    interface MpxWebpackPluginOptions {
    style: {
      cssCondition?: {
        before?: boolean
        after?: boolean
        beforeExclude?: (string | RegExp)[]
        afterExclude?: (string | RegExp)[]
        legacy?: boolean
        afterLegacy?: boolean
        beforeLegacy?: boolean
      }
    }
  }

  type MpxLoaderContext<T> = webpack.LoaderContext<T> & {
    getMpx(): MpxContext
  }

  interface MpxContext {
    /**
     * 用于使用 webpack-virtual-modules 功能，目前仅在输出 web 时支持使用
     */
    __vfs: any | null

    /**
     * app 信息，便于获取 appName
     */
    appInfo: {
      resourcePath?: string
      name?: string
      [key: string]: any
    }

    /**
     * pageConfig 信息
     */
    pageConfigsMap: Record<string, any>

    /**
     * pages 全局记录，无需区分主包/分包
     */
    pagesMap: Record<string, string>

    /**
     * 组件资源记录，按所属包进行记录（如 componentsMap.main）
     */
    componentsMap: Record<string, Record<string, string>>

    /**
     * 静态资源（图片、字体、独立样式）等，按所属包进行记录
     */
    staticResourcesMap: Record<string, Record<string, string>>

    /**
     * 用于记录命中 subpackageModulesRules 的 JS 模块分包归属，用于 JS 多分包冗余输出
     */
    subpackageModulesMap: Record<string, Record<string, string>>

    /**
     * 记录其他资源，如 pluginMain、pluginExport，无需区分主包/分包
     */
    otherResourcesMap: Record<string, any>

    /**
     * 记录独立分包
     */
    independentSubpackagesMap: Record<string, any>

    subpackagesEntriesMap: Record<string, any>
    postSubpackageEntriesMap: Record<string, any>
    replacePathMap: Record<string, string>

    /**
     * 导出模块集合
     */
    exportModules: Set<any>

    /**
     * 记录动态添加入口的分包信息
     */
    dynamicEntryInfo: Record<string, any>

    /**
     * 记录 entryModule 与 entryNode 的对应关系，用于体积分析
     */
    entryNodeModulesMap: Map<any, any>

    /**
     * 记录与 asset 相关联的 modules，用于体积分析
     */
    assetsModulesMap: Map<string, Set<any>>

    /**
     * 记录与 asset 相关联的 AST，用于体积分析和 esCheck，避免重复 parse
     */
    assetsASTsMap: Map<string, any>

    /**
     * 记录 RequireExternalDependency 相关资源路径
     */
    externalRequestsMap: Map<string, any>

    globalComponents: Record<string, any>
    globalComponentsInfo: Record<string, any>

    /**
     * todo: es6 Map 读写性能高于 object，之后会逐步替换
     */
    wxsAssetsCache: Map<string, any>
    addEntryPromiseMap: Map<string, Promise<any>>
    currentPackageRoot: string
    wxsContentMap: Record<string, string>

    /**
     * 是否强制使用页面构造函数
     */
    forceUsePageCtor: boolean

    resolveMode: string
    mode: string
    srcMode: string
    env: string
    externalClasses: string[]
    projectRoot: string
    autoScopeRules: any
    autoVirtualHostRules: any
    customTextRules: any
    transRpxRules: any
    postcssInlineConfig: any
    decodeHTMLText: boolean

    /**
     * native 文件专用配置
     */
    i18n: any | null
    checkUsingComponentsRules: any
    forceDisableBuiltInLoader: boolean

    /**
     * 默认的应用标题
     */
    appTitle: string

    attributes: any[]
    externals: any[]
    useRelativePath: boolean
    removedChunks: any[]
    forceProxyEventRules: any

    /**
     * 若配置 disableRequireAsync=true，则全平台构建不支持异步分包
     */
    supportRequireAsync: boolean
    partialCompileRules: any
    asyncSubpackageRules: any[]
    transSubpackageRules: any
    optimizeRenderRules: any[]

    addEntryModuleIssuer: (module: string, issuer: string) => void

    /**
     * 资源路径的哈希函数（用于生成输出唯一名）
     */
    pathHash: (resourcePath: string) => string

    // 缓存与工具
    loaderContentCache: Map<string, any>
    extractedFilesCache: Map<string, string>

    // 函数接口

    /**
     * 收集动态入口信息（分包、文件名、是否为页面、是否包含异步等）
     */
    collectDynamicEntryInfo: (info: { resource: string; packageName: string; filename: string; entryType: string; hasAsync: boolean }) => void

    /**
     * 添加入口（包装了 webpack 的 addEntry）
     */
    addEntry: (request: string, name: string, callback: (err?: Error, result?: any) => void) => any

    getModuleId: (filePath: string, isApp?: boolean) => string
    getEntryNode: (module: any, type?: string) => any

    /**
     * 根据资源路径和类型返回输出路径（支持自定义输出、冲突处理等）
     */
    getOutputPath: (resourcePath: string, type: string, opts?: { ext?: string; conflictPath?: string }) => string

    /**
     * 获取提取后的文件名（支持静态、插件、普通资源）
     */
    getExtractedFile: (resource: string, opts?: { error?: (err: Error) => void }) => string

    recordResourceMap: (params: {
      resourcePath: string
      resourceType: string
      outputPath?: string
      packageRoot?: string
      recordOnly?: boolean
      warn?: (e: Error) => void
      error?: (e: Error) => void
    }) => { outputPath?: string; alreadyOutputted?: boolean }

    getPackageInfo: (params: {
      resource: string
      resourceType: string
      outputPath?: string
      issuerResource?: string
      warn?: (e: Error) => void
      error?: (e: Error) => void
    }) => { packageName: string; packageRoot: string; outputPath?: string; alreadyOutputted?: boolean }

    // 运行时信息与注入相关
    runtimeInfo: Record<string, any>
    dynamicSlotDependencies: Record<string, any>
    dynamicTemplateRuleRunner: any

    /**
     * 依据 package 注入到 mpx-custom-element-*.json 里面的组件路径
     */
    getPackageInjectedComponentsMap: (packageName?: string) => Record<string, string>

    getPackageInjectedTemplateConfig: (packageName?: string) => any
    injectDynamicSlotDependencies: (usingComponents: string, resourcePath: string) => string
    changeHashNameForAstNode: (templateAst: string, componentsMap: any) => string
    collectDynamicSlotDependencies: (packageName?: string) => void

    // 其它任意扩展字段
    [key: string]: any
  }
}
