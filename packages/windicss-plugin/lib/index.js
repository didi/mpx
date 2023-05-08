const { Processor } = require('windicss/lib')
const windiParser = require('windicss/utils/parser')
const { parseClasses, parseStrings, parseTags, parseMustache, stringifyAttr, parseComments, parseCommentConfig } = require('./parser')
const { buildAliasTransformer, transformGroups, mpEscape, cssRequiresTransform } = require('./transform')
const { getReplaceSource, getConcatSource, getRawSource } = require('./source')
const mpxConfig = require('@mpxjs/webpack-plugin/lib/config')
const toPosix = require('@mpxjs/webpack-plugin/lib/utils/to-posix')
const fixRelative = require('@mpxjs/webpack-plugin/lib/utils/fix-relative')
const path = require('path')
const { loadConfiguration, defaultConfigureFiles } = require('@windicss/config')
const minimatch = require('minimatch')
const MpxWebpackPlugin = require('@mpxjs/webpack-plugin')
const loadersPath = path.resolve(__dirname, './loader')
const transAppLoader = path.resolve(loadersPath, 'windicss-app.js')
const PluginName = 'MpxWindicssPlugin'
function normalizeOptions (options) {
  let {
    // 小程序特有的配置
    windiFile = 'styles/windi',
    styleIsolation = 'isolated',
    minCount = 2,
    scan = {},
    // 公共的配置
    root = process.cwd(),
    transformCSS = true,
    transformGroups = true,
    webOptions = {},
    configFiles,
    config,
    ...rest
  } = options
  // web配置，剔除小程序的配置，防影响
  webOptions = {
    root,
    transformCSS,
    transformGroups,
    configFiles,
    config,
    ...rest,
    ...webOptions
  }
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
    ...rest
  }
}
function validateConfig (config, error) {
  if (config.attributify) {
    error('小程序环境下无法使用attributify模式，该配置将被忽略！')
  }
  return config
}

function getCommonClassesMap (classesMaps, minCount) {
  const commonClassesMap = {}
  const allClassesMap = classesMaps.reduce((acc, cur) => Object.assign(acc, cur), {})

  Object.keys(allClassesMap).forEach((item) => {
    let count = 0
    for (const classesMap of classesMaps) {
      if (classesMap[item]) count++
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

function getPlugin (compiler, curPlugin) {
  const plugins = compiler.options.plugins
  return plugins.find(plugin => Object.getPrototypeOf(plugin).constructor === curPlugin)
}
const isProductionLikeMode = options => {
  return options.mode === 'production' || !options.mode
}

class MpxWindicssPlugin {
  constructor (options = {}) {
    this.options = normalizeOptions(options)
  }

  generateStyle (processor, classesMap = {}, preflightOptions = {}) {
    const classes = Object.keys(classesMap).join(' ')

    let styleSheet = processor.interpret(classes).styleSheet
    if (preflightOptions.enablePreflight) {
      const { html, includeAll, includeBase, includeGlobal, includePlugin } = preflightOptions
      styleSheet = processor.preflight(includeAll ? null : html, includeBase, includeGlobal, includePlugin).extend(styleSheet)
    }
    styleSheet.children.forEach((style) => {
      if (style.selector) {
        style.selector = mpEscape(style.selector)
      }
    })
    return styleSheet.sort().combine().build(this.options.minify)
  }

  loadConfig (compilation, error) {
    const { root, config, configFiles = defaultConfigureFiles } = this.options
    const { error: err, config: resolved, filepath } = loadConfiguration(this.options)
    if (err) error(err)
    if (filepath) {
      compilation.fileDependencies.add(filepath)
      // fix jiti require cache for watch
      delete require.cache[filepath]
    }

    if (!config) {
      for (const file of configFiles) {
        const tryPath = path.resolve(root, file)
        if (tryPath === filepath) break
        compilation.missingDependencies.add(tryPath)
      }
    }

    return validateConfig(resolved, error)
  }

  getSafeListClasses (safelist) {
    let classes = []
    if (typeof safelist === 'string') {
      classes = safelist.split(/\s/).filter(i => i)
    }
    if (Array.isArray(safelist)) {
      for (const item of safelist) {
        if (typeof item === 'string') {
          classes.push(item)
        } else if (Array.isArray(item)) {
          classes = classes.concat(item)
        }
      }
    }
    return classes
  }

  apply (compiler) {
    const mpxPluginInstance = getPlugin(compiler, MpxWebpackPlugin)
    if (!mpxPluginInstance) {
      const logger = compiler.getInfrastructureLogger(PluginName)
      logger.error(new Error('@mpxjs/windicss-plugin需要与@mpxjs/webpack-plugin配合使用，请检查!'))
      return
    }
    const { mode } = mpxPluginInstance.options
    this.options.minify = isProductionLikeMode(compiler.options)
    if (mode === 'web') {
      // web直接用插件
      const WindiCSSWebpackPlugin = require('windicss-webpack-plugin')
      if (!getPlugin(compiler, WindiCSSWebpackPlugin)) {
        compiler.options.plugins.push(new WindiCSSWebpackPlugin(this.options.webOptions))
      }
      // 给app注入windicss模块
      compiler.options.module.rules.push({
        test: /\.js$/,
        resourceQuery: /isApp/,
        enforce: 'post',
        use: [{
          loader: transAppLoader,
          options: {
            virtualModulePath: this.options.webOptions.virtualModulePath || ''
          }
        }]
      })
      // 后续似乎不需要处理了，先return
      return
    }
    compiler.hooks.thisCompilation.tap(PluginName, (compilation) => {
      compilation.hooks.processAssets.tapPromise({
        name: PluginName,
        stage: compilation.PROCESS_ASSETS_STAGE_ADDITIONS
      }, async (assets) => {
        const { __mpx__: mpx } = compilation
        const error = (msg) => {
          compilation.errors.push(new Error(msg))
        }
        // const warn = (msg) => {
        //   compilation.warnings.push(new Error(msg))
        // }

        const { mode, dynamicEntryInfo, appInfo } = mpx
        if (mode === 'web') return

        const config = this.loadConfig(compilation, error)
        const processor = new Processor(config)

        const { template: templateExt, styles: styleExt } = mpxConfig[mode].typeExtMap

        const packages = Object.keys(dynamicEntryInfo)

        function getPackageName (file) {
          file = toPosix(file)
          for (const packageName of packages) {
            if (packageName === 'main') continue
            if (file.startsWith(packageName + '/')) return packageName
          }
          return 'main'
        }

        const packageClassesMaps = {
          main: {}
        }
        const mainClassesMap = packageClassesMaps.main

        // config中的safelist视为主包classes
        const safeListClasses = this.getSafeListClasses(processor.config('safelist'))

        safeListClasses.forEach((className) => {
          mainClassesMap[className] = true
        })

        const commentConfigMap = {}

        const tagsMap = {}
        const cssEscape = processor.e
        const transformAlias = buildAliasTransformer(config.alias)
        const transformClasses = (source, classNameHandler = c => c) => {
          // pre process
          source = transformAlias(source)
          if (this.options.transformGroups) {
            source = transformGroups(source)
          }
          const content = source.source()
          // escape & fill classesMap
          return content.split(/\s+/).map(classNameHandler).join(' ')
        }
        // transform directives like @apply @variants @screen @layer theme()
        const processStyle = (file, source) => {
          const content = source.source()
          if (!content || !cssRequiresTransform(content)) return
          const style = new windiParser.CSSParser(content, processor).parse()
          const output = style.build()
          if (!output || output.length <= 0) {
            error(`${file} 解析style错误,检查样式文件输入!`)
            return
          }
          assets[file] = getRawSource(output)
        }
        const processTemplate = (file, source) => {
          source = getReplaceSource(source)

          const content = source.original().source()

          const packageName = getPackageName(file)

          const filename = file.slice(0, -templateExt.length)

          const currentClassesMap = packageClassesMaps[packageName] = packageClassesMaps[packageName] || {}

          const classNameHandler = (className) => {
            if (!className) return className
            if (packageName === 'main') {
              mainClassesMap[className] = true
            } else if (!mainClassesMap[className]) {
              currentClassesMap[className] = true
            }
            return mpEscape(cssEscape(className))
          }

          const commentConfig = {}

          // process comments
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

          // process classes
          parseClasses(content).forEach(({ result, start, end }) => {
            let { replaced, val } = parseMustache(result, (exp) => {
              const expSource = getReplaceSource(exp)
              parseStrings(exp).forEach(({ result, start, end }) => {
                result = transformClasses(result, classNameHandler)
                expSource.replace(start, end, result)
              })
              return expSource.source()
            }, (str) => transformClasses(str, classNameHandler))

            if (replaced) {
              val = stringifyAttr(val)
              source.replace(start - 1, end + 1, val)
            }
          })

          if (enablePreflight) {
            const { blocklist, alias } = preflightOptions
            // process preflight
            parseTags(content).forEach((tagName) => {
              tagName = alias[tagName] || tagName
              if (blocklist.has(tagName)) return
              tagsMap[tagName] = true
            })
          }

          assets[file] = source
        }
        const filterFile = (file) => {
          const { include = [], exclude = [] } = this.options.scan
          for (const pattern of exclude) {
            if (minimatch(file, pattern)) return false
          }
          for (const pattern of include) {
            if (!minimatch(file, pattern)) return false
          }
          return true
        }

        const enablePreflight = !!config.preflight

        const preflightOptions = Object.assign(
          {
            includeBase: true,
            includeGlobal: false,
            includePlugin: true,
            enableAll: false,
            includeAll: false,
            safelist: [],
            blocklist: [],
            alias: {}
          },
          typeof config.preflight === 'boolean' ? {} : config.preflight
        )

        preflightOptions.includeAll = preflightOptions.includeAll || preflightOptions.enableAll
        preflightOptions.enablePreflight = enablePreflight
        preflightOptions.blocklist = new Set(preflightOptions.blocklist)

        Object.entries(assets).forEach(([file, source]) => {
          if (!filterFile(file)) return
          if (this.options.transformCSS && file.endsWith(styleExt)) return processStyle(file, source)
          if (file.endsWith(templateExt)) return processTemplate(file, source)
        })

        delete packageClassesMaps.main
        const commonClassesMap = getCommonClassesMap(Object.values(packageClassesMaps), this.options.minCount)
        Object.assign(mainClassesMap, commonClassesMap)

        if (enablePreflight) preflightOptions.html = Object.keys(tagsMap).map(i => `<${i}/>`).join(' ')

        // 生成主包windi.css
        let mainWindiFile
        const mainWindiFileContent = this.generateStyle(processor, mainClassesMap, preflightOptions)
        if (mainWindiFileContent) {
          mainWindiFile = this.options.windiFile + styleExt
          if (assets[mainWindiFile]) error(`${mainWindiFile}当前已存在于[compilation.assets]中，请修改[options.windiFile]配置以规避冲突！`)
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
        Object.entries(packageClassesMaps).forEach(([packageRoot, classesMap]) => {
          let windiFile
          const windiFileContent = this.generateStyle(processor, classesMap)
          if (windiFileContent) {
            windiFile = toPosix(path.join(packageRoot, this.options.windiFile + styleExt))
            if (assets[windiFile]) error(`${windiFile}当前已存在于[compilation.assets]中，请修改[options.windiFile]配置以规避冲突！`)
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
        })
      })
    })
  }
}

module.exports = MpxWindicssPlugin
