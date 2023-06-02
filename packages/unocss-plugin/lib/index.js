const path = require('node:path')
const minimatch = require('minimatch')
const unoConfig = require('@unocss/config')
const core = require('@unocss/core')
const mpxConfig = require('@mpxjs/webpack-plugin/lib/config')
const toPosix = require('@mpxjs/webpack-plugin/lib/utils/to-posix')
const fixRelative = require('@mpxjs/webpack-plugin/lib/utils/fix-relative')
const MpxWebpackPlugin = require('@mpxjs/webpack-plugin')
const { parseClasses, parseStrings, parseMustache, stringifyAttr, parseComments, parseCommentConfig } = require('./parser')
const { getReplaceSource, getConcatSource, getRawSource } = require('./source')
const { buildAliasTransformer, transformGroups, mpEscape, cssRequiresTransform } = require('./transform')

const loadersPath = path.resolve(__dirname, './loaders')
const transAppLoader = path.resolve(loadersPath, 'unocss-app.js')

const PLUGIN_NAME = 'MpxUnocssPlugin'

function filterFile(file, scan) {
  const { include = [], exclude = [] } = scan
  for (const pattern of exclude) {
    if (minimatch(file, pattern))
      return false
  }

  for (const pattern of include) {
    if (!minimatch(file, pattern))
      return false
  }

  return true
}

function normalizeOptions(options) {
  let {
    // 小程序特有的配置
    windiFile = 'styles/uno',
    styleIsolation = 'isolated',
    minCount = 2,
    scan = {},
    // 公共的配置
    root = process.cwd(),
    config,
    configFiles,
    transformCSS = true,
    transformGroups = true,
    webOptions = {},
    ...rest
  } = options
  // web配置，剔除小程序的配置，防影响
  webOptions = {
    root,
    config,
    configFiles,
    transformCSS,
    transformGroups,
    scan: {
      include: ['src/**/*'],
    },
    ...rest,
    ...webOptions,
  }
  // virtualModulePath暂不支持配置
  webOptions.virtualModulePath = ''
  return {
    windiFile,
    root,
    styleIsolation,
    minCount,
    scan,
    transformCSS,
    transformGroups,
    webOptions,
    configFiles,
    config,
    ...rest,
  }
}

function getCommonClassesMap(classesMaps, minCount) {
  const commonClassesMap = {}
  const allClassesMap = classesMaps.reduce((acc, cur) => Object.assign(acc, cur), {})

  Object.keys(allClassesMap).forEach((item) => {
    let count = 0
    for (const classesMap of classesMaps) {
      if (classesMap[item])
        count++
      if (count >= minCount) {
        commonClassesMap[item] = true
        classesMaps.forEach((classesMap) => {
          delete classesMap[item]
        })
        break
      }
    }
  })

  return commonClassesMap
}

function createContext(root, defaults = {}) {
  let rawConfig = {}
  const uno = core.createGenerator(rawConfig, defaults)

  async function loadConfig() {
    const result = await unoConfig.loadConfig(root, {}, [], {})
    rawConfig = result.config
    uno.setConfig(rawConfig)
    return result
  }
  async function getConfig() {
    await loadConfig()
    return rawConfig
  }
  return {
    getConfig,
    uno,
    rawConfig,
  }
}

function isProductionLikeMode(options) {
  return options.mode === 'production' || !options.mode
}

function getPlugin(compiler, curPlugin) {
  const plugins = compiler.options.plugins
  return plugins.find(plugin => Object.getPrototypeOf(plugin).constructor === curPlugin)
}

class MpxUnocssPlugin {
  constructor(options = {}) {
    this.options = normalizeOptions(options)
  }

  async generateStyle(uno, classesMap = {}, preflightOptions = {}) {
    const classes = Object.keys(classesMap)
    const tokens = new Set(classes)
    const result = await uno.generate(tokens, preflightOptions)
    let css = result.css
    classes.forEach((item) => {
      const selector = core.e(item)
      const mpClass = mpEscape(selector)
      if (mpClass !== selector)
        css = css.replace(selector, mpClass)
    })
    return css
  }

  getSafeListClasses(safelist) {
    let classes = []
    if (typeof safelist === 'string')
      classes = safelist.split(/\s/).filter(i => i)

    if (Array.isArray(safelist)) {
      for (const item of safelist) {
        if (typeof item === 'string')
          classes.push(item)

        else if (Array.isArray(item))
          classes = classes.concat(item)
      }
    }
    return classes
  }

  apply(compiler) {
    const ctx = createContext(this.options.root)
    const { uno, getConfig } = ctx
    this.minify = isProductionLikeMode(compiler.options)

    // 处理web
    const mpxPluginInstance = getPlugin(compiler, MpxWebpackPlugin)
    if (!mpxPluginInstance) {
      const logger = compiler.getInfrastructureLogger(PLUGIN_NAME)
      logger.error(new Error('@mpxjs/unocss-plugin需要与@mpxjs/webpack-plugin配合使用，请检查!'))
      return
    }
    const mode = this.mode = mpxPluginInstance.options.mode
    if (mode === 'web') {
      const UnoCSSWebpackPlugin = require('@unocss/webpack').default
      if (!getPlugin(compiler, UnoCSSWebpackPlugin))
        compiler.options.plugins.push(new UnoCSSWebpackPlugin(this.options.webOptions))
      // 给app注入windicss模块
      compiler.options.module.rules.push({
        test: /\.mpx$/,
        resourceQuery: /isApp/,
        enforce: 'pre',
        use: [transAppLoader],
      })
      compiler.hooks.done.tap(PLUGIN_NAME, ({ compilation }) => {
        for (const dep of compilation.fileDependencies) {
          if (/^(?:virtual:)?uno(?::(.+))?\.css(\?.*)?$/.test(dep)) {
            // 移除虚拟模块产生的fileDeps避免初始watch执行两次
            compilation.fileDependencies.delete(dep)
          }
        }
      })
      return
    }
    compiler.hooks.thisCompilation.tap(PLUGIN_NAME, (compilation) => {
      compilation.hooks.processAssets.tapPromise({
        name: PLUGIN_NAME,
        stage: compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
      }, async (assets) => {
        const { __mpx__: mpx } = compilation
        const error = (msg) => {
          compilation.errors.push(new Error(msg))
        }
        const warn = (msg) => {
          compilation.warnings.push(new Error(msg))
        }
        const config = await getConfig()

        const enablePreflight = config.preflight !== false && Boolean(this.options.preflight)

        if (enablePreflight)
          warn('由于底层实现的差异，开启preflight可能导致输出web与输出小程序存在样式差异，如需输出web请关闭该配置！')

        const preflightOptions = { preflights: false, safelist: false, minify: this.minify }
        const { mode, dynamicEntryInfo, appInfo } = mpx
        // 包相关
        const packages = Object.keys(dynamicEntryInfo)
        function getPackageName(file) {
          file = toPosix(file)
          for (const packageName of packages) {
            if (packageName === 'main')
              continue
            if (file.startsWith(`${packageName}/`))
              return packageName
          }
          return 'main'
        }
        // 处理wxss
        const processStyle = async (file, source) => {
          const content = source.source()
          if (!content || !cssRequiresTransform(content))
            return
          const unores = await uno.generate(content, preflightOptions)
          const output = unores.css
          if (!output || output.length <= 0) {
            error(`${file} 解析style错误,检查样式文件输入!`)
            return
          }
          assets[file] = getRawSource(output)
        }
        // 处理wxml
        const { template: templateExt, styles: styleExt } = mpxConfig[mode].typeExtMap
        const packageClassesMaps = {
          main: {},
        }
        const commentConfigMap = {}

        const mainClassesMap = packageClassesMaps.main
        const cssEscape = core.e
        // config中的safelist视为主包classes
        const safeListClasses = this.getSafeListClasses(config.safelist)

        safeListClasses.forEach((className) => {
          mainClassesMap[className] = true
        })
        const transformAlias = buildAliasTransformer(config.alias)
        const transformClasses = (source, classNameHandler = c => c) => {
          // pre process
          source = transformAlias(source)
          if (this.options.transformGroups)
            source = transformGroups(source)
          const content = source.source()
          // escape & fill classesMap
          return content.split(/\s+/).map(classNameHandler).join(' ')
        }

        const processTemplate = async (file, source) => {
          source = getReplaceSource(source)
          const content = source.original().source()

          const packageName = getPackageName(file)
          const filename = file.slice(0, -templateExt.length)
          const currentClassesMap = packageClassesMaps[packageName] = packageClassesMaps[packageName] || {}

          // process classes

          const classNameHandler = (className) => {
            if (!className)
              return className
            if (packageName === 'main')
              mainClassesMap[className] = true

            else if (!mainClassesMap[className])
              currentClassesMap[className] = true
            return mpEscape(cssEscape(className))
          }
          parseClasses(content).forEach(({ result, start, end }) => {
            let { replaced, val } = parseMustache(result, (exp) => {
              const expSource = getReplaceSource(exp)
              parseStrings(exp).forEach(({ result, start, end }) => {
                result = transformClasses(result, classNameHandler)
                expSource.replace(start, end, result)
              })
              return expSource.source()
            }, str => transformClasses(str, classNameHandler))
            if (replaced) {
              val = stringifyAttr(val)
              source.replace(start - 1, end + 1, val)
            }
          })
          // process comments
          const commentConfig = {}
          parseComments(content).forEach(({ result, start, end }) => {
            Object.assign(commentConfig, parseCommentConfig(result))
            source.replace(start, end, '')
          })
          if (commentConfig.safelist) {
            this.getSafeListClasses(commentConfig.safelist).forEach((className) => {
              classNameHandler(className)
            })
          }

          commentConfigMap[filename] = commentConfig

          assets[file] = source
        }
        await Promise.all(Object.entries(assets).map(([file, source]) => {
          if (!filterFile(file, this.options.scan))
            return Promise.resolve()
          if (this.options.transformCSS && file.endsWith(styleExt))
            return processStyle(file, source)
          if (file.endsWith(templateExt))
            return processTemplate(file, source)
          return Promise.resolve()
        }))
        delete packageClassesMaps.main
        const commonClassesMap = getCommonClassesMap(Object.values(packageClassesMaps), this.options.minCount)
        Object.assign(mainClassesMap, commonClassesMap)
        // 生成主包windi.css
        let mainWindiFile
        const mainWindiFileContent = await this.generateStyle(uno, mainClassesMap, { ...preflightOptions, preflights: true })
        if (mainWindiFileContent) {
          mainWindiFile = this.options.windiFile + styleExt
          if (assets[mainWindiFile])
            error(`${mainWindiFile}当前已存在于[compilation.assets]中，请修改[options.windiFile]配置以规避冲突！`)
          assets[mainWindiFile] = getRawSource(mainWindiFileContent)
        }

        if (mainWindiFile) {
          const appStyleFile = appInfo.name + styleExt
          const mainRelativePath = fixRelative(toPosix(path.relative(path.dirname(appStyleFile), mainWindiFile)), mode)

          const appStyleSource = getConcatSource(`@import ${JSON.stringify(mainRelativePath)};\n`)
          appStyleSource.add(assets[appStyleFile] || '')
          assets[appStyleFile] = appStyleSource
          dynamicEntryInfo.main.entries.forEach(({ entryType, filename }) => {
            const commentConfig = commentConfigMap[filename] || {}
            const styleIsolation = commentConfig.styleIsolation || this.options.styleIsolation
            if (styleIsolation === 'isolated' && entryType === 'component') {
              const componentStyleFile = filename + styleExt
              const mainRelativePath = fixRelative(toPosix(path.relative(path.dirname(componentStyleFile), mainWindiFile)), mode)
              const componentStyleSource = getConcatSource(`@import ${JSON.stringify(mainRelativePath)};\n`)
              componentStyleSource.add(assets[componentStyleFile] || '')
              assets[componentStyleFile] = componentStyleSource
            }
          })
        }
        // 生成分包windi.css
        await Promise.all(Object.entries(packageClassesMaps).map(async ([packageRoot, classesMap]) => {
          let windiFile
          const windiFileContent = await this.generateStyle(uno, classesMap, preflightOptions)
          if (windiFileContent) {
            windiFile = toPosix(path.join(packageRoot, this.options.windiFile + styleExt))
            if (assets[windiFile])
              error(`${windiFile}当前已存在于[compilation.assets]中，请修改[options.windiFile]配置以规避冲突！`)
            assets[windiFile] = getRawSource(windiFileContent)
          }

          dynamicEntryInfo[packageRoot].entries.forEach(({ entryType, filename }) => {
            if (windiFile && entryType === 'page') {
              const pageStyleFile = filename + styleExt
              const relativePath = fixRelative(toPosix(path.relative(path.dirname(pageStyleFile), windiFile)), mode)
              const pageStyleSource = getConcatSource(`@import ${JSON.stringify(relativePath)};\n`)
              pageStyleSource.add(assets[pageStyleFile] || '')
              assets[pageStyleFile] = pageStyleSource
            }

            const commentConfig = commentConfigMap[filename] || {}
            const styleIsolation = commentConfig.styleIsolation || this.options.styleIsolation
            if (styleIsolation === 'isolated' && entryType === 'component') {
              const componentStyleFile = filename + styleExt
              const componentStyleSource = getConcatSource('')

              if (mainWindiFile) {
                const mainRelativePath = fixRelative(toPosix(path.relative(path.dirname(componentStyleFile), mainWindiFile)), mode)
                componentStyleSource.add(`@import ${JSON.stringify(mainRelativePath)};\n`)
              }

              if (windiFile) {
                const relativePath = fixRelative(toPosix(path.relative(path.dirname(componentStyleFile), windiFile)), mode)
                componentStyleSource.add(`@import ${JSON.stringify(relativePath)};\n`)
              }

              componentStyleSource.add(assets[componentStyleFile] || '')
              assets[componentStyleFile] = componentStyleSource
            }
          })
        }))
      })
    })
  }
}

module.exports = MpxUnocssPlugin
