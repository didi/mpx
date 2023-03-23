const { Processor } = require('windicss/lib')
const { parseClasses, parseStrings, parseTags, parseMustache, stringifyAttr } = require('./parser')
const { buildAliasTransformer, transformGroups, mpEscape } = require('./transform')
const { getReplaceSource, getConcatSource, getRawSource } = require('./source')
const mpxConfig = require('@mpxjs/webpack-plugin/lib/config')
const toPosix = require('@mpxjs/webpack-plugin/lib/utils/to-posix')
const fixRelative = require('@mpxjs/webpack-plugin/lib/utils/fix-relative')
const path = require('path')
const { loadConfiguration, defaultConfigureFiles } = require('@windicss/config')

function normalizeOptions (options) {
  // todo
  options.windiFile = options.windiFile || 'styles/windi'
  options.minify = options.minify || false
  // options.config = options.config
  // options.configFiles = options.configFiles
  options.root = options.root || process.cwd()
  return options
}

function validateConfig (config, error) {
  if (config.attributify) {
    error('小程序环境下无法使用attributify模式，该配置将被忽略！')
  }
  return config

}

function getCommonClassesMap (classesMaps) {
  const commonClassesMap = {}

  const allClassesMap = classesMaps.reduce((acc, cur) => Object.assign(acc, cur), {})

  Object.keys(allClassesMap).forEach((item) => {
    if (classesMaps.every((classesMap) => classesMap[item])) {
      commonClassesMap[item] = true
      classesMaps.forEach((classesMap) => {
        delete classesMap[item]
      })
    }
  })

  return commonClassesMap
}

class MpxWindicssPlugin {
  constructor (options = {}) {
    this.options = normalizeOptions(options)
  }

  generateStyle (processor, classesMap = {}, tagsMap = {}) {
    const classes = Object.keys(classesMap).join(' ')
    const tags = Object.keys(tagsMap).map(i => `<${i}/>`).join(' ')

    let styleSheet = processor.interpret(classes).styleSheet
    if (tags) {
      styleSheet = processor.preflight(tags).extend(styleSheet)
    }
    styleSheet.children.forEach((style) => {
      if (style.selector) {
        style.selector = mpEscape(style.selector)
      }
    })
    return styleSheet.sort().combine().build(this.options.minify)
  }

  loadConfig (compilation, error) {
    let { root, config, configFiles = defaultConfigureFiles } = this.options
    const { error: err, config: resolved, filepath } = loadConfiguration(this.options)
    if (err) error(err)
    if (filepath) compilation.fileDependencies.add(filepath)

    if (!config) {
      for (const file of configFiles) {
        const tryPath = path.resolve(root, file)
        if (tryPath === filepath) break
        compilation.missingDependencies.add(tryPath)
      }
    }

    return validateConfig(resolved, error)
  }

  getSafeListClasses (processor) {
    let safelist = processor.config('safelist')
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
    compiler.hooks.thisCompilation.tap('MpxWindicssPlugin', (compilation) => {
      compilation.hooks.processAssets.tapPromise({
        name: 'MpxWindicssPlugin',
        stage: compilation.PROCESS_ASSETS_STAGE_ADDITIONS
      }, async (assets) => {
        const { __mpx__: mpx } = compilation
        const error = (msg) => {
          compilation.errors.push(new Error(msg))
        }
        const warn = (msg) => {
          compilation.warnings.push(new Error(msg))
        }
        if (!mpx) {
          error(`@mpxjs/windicss-plugin需要与@mpxjs/webpack-plugin配合使用，请检查!`)
          return
        }

        const { mode, dynamicEntryInfo, appInfo } = mpx

        // 输出web时暂不处理
        if (mode === 'web') return

        const config = this.loadConfig(compilation, error)

        const processor = new Processor(config)

        const { template: templateExt, styles: styleExt } = mpxConfig[mode].typeExtMap

        const packages = Object.keys(dynamicEntryInfo)

        function getPackageName (fileName) {
          fileName = toPosix(fileName)
          for (const packageName of packages) {
            if (packageName === 'main') continue
            if (fileName.startsWith(packageName + '/')) return packageName
          }
          return 'main'
        }

        const packageClassesMaps = {
          main: {}
        }
        const mainClassesMap = packageClassesMaps.main

        // config中的safelist视为主包classes
        const safeListClasses = this.getSafeListClasses(processor)

        safeListClasses.forEach((className) => {
          mainClassesMap[className] = true
        })

        const tagsMap = {}
        const cssEscape = processor.e
        const transformAlias = buildAliasTransformer(config.alias)
        const transformClasses = (source, classNameHandler = c => c) => {
          // pre process
          source = transformAlias(source)
          source = transformGroups(source)
          const content = source.source()
          // escape & fill classesMap
          return content.trim().split(/\s+/).map(classNameHandler).join(' ')
        }

        Object.entries(assets).forEach(([filename, source]) => {
          if (!filename.endsWith(templateExt)) return

          source = getReplaceSource(source)

          const content = source.source()

          const packageName = getPackageName(filename)

          const currentClassesMap = packageClassesMaps[packageName] = packageClassesMaps[packageName] || {}

          const classNameHandler = (className) => {
            if (packageName === 'main') {
              mainClassesMap[className] = true
            } else if (!mainClassesMap[className]) {
              currentClassesMap[className] = true
            }
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
            }, (str) => transformClasses(str, classNameHandler))


            if (replaced) {
              val = stringifyAttr(val)
              source.replace(start - 1, end + 1, val)
            }
          })

          if (config.preflight) {
            parseTags(content).forEach((tagName) => {
              tagsMap[tagName] = true
            })
          }

          assets[filename] = source
        })

        delete packageClassesMaps.main
        const commonClassesMap = getCommonClassesMap(Object.values(packageClassesMaps))
        Object.assign(mainClassesMap, commonClassesMap)

        // 生成主包windi.css
        const windiFileContent = this.generateStyle(processor, mainClassesMap, tagsMap)
        if (windiFileContent) {
          const windiFile = this.options.windiFile + styleExt
          if (assets[windiFile]) error(`${windiFile}当前已存在于[compilation.assets]中，请修改[options.windiFile]配置以规避冲突！`)
          assets[windiFile] = getRawSource(windiFileContent)

          const appFile = appInfo.name + styleExt
          let relativePath = toPosix(path.relative(path.dirname(appFile), windiFile))
          relativePath = fixRelative(relativePath, mode)
          const appStyleSource = getConcatSource(`@import ${JSON.stringify(relativePath)};\n`)
          appStyleSource.add(assets[appFile] || '')
          assets[appFile] = appStyleSource
        }


        // 生成分包windi.css
        Object.entries(packageClassesMaps).forEach(([packageRoot, classesMap]) => {
          const windiFileContent = this.generateStyle(processor, classesMap)
          if (windiFileContent) {
            const windiFile = toPosix(path.join(packageRoot, this.options.windiFile + styleExt))

            if (assets[windiFile]) error(`${windiFile}当前已存在于[compilation.assets]中，请修改[options.windiFile]配置以规避冲突！`)
            assets[windiFile] = getRawSource(windiFileContent)

            dynamicEntryInfo[packageRoot].entries.forEach(({ entryType, filename }) => {
              if (entryType === 'page') {
                const pageFile = filename + styleExt
                let relativePath = toPosix(path.relative(path.dirname(pageFile), windiFile))
                relativePath = fixRelative(relativePath, mode)
                const pageStyleSource = getConcatSource(`@import ${JSON.stringify(relativePath)};\n`)
                pageStyleSource.add(assets[pageFile] || '')
                assets[pageFile] = pageStyleSource
              }
            })
          }
        })
      })
    })
  }
}

module.exports = MpxWindicssPlugin
