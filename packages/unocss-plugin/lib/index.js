import MpxWebpackPlugin from '@mpxjs/webpack-plugin'
import mpxConfig from '@mpxjs/webpack-plugin/lib/config.js'
import env from '@mpxjs/webpack-plugin/lib/utils/env.js'
import escapeWxsObjectKey from '@mpxjs/webpack-plugin/lib/utils/escape-class-object-key.js'
import fixRelative from '@mpxjs/webpack-plugin/lib/utils/fix-relative.js'
import parseRequest from '@mpxjs/webpack-plugin/lib/utils/parse-request.js'
import set from '@mpxjs/webpack-plugin/lib/utils/set.js'
import sourceLocation from '@mpxjs/webpack-plugin/lib/utils/source-location.js'
import toPosix from '@mpxjs/webpack-plugin/lib/utils/to-posix.js'
import isValidIdentifierStr from '@mpxjs/webpack-plugin/lib/utils/is-valid-identifier-str.js'
import { loadConfig } from '@unocss/config'
import { createGenerator, e as cssEscape } from '@unocss/core'
import transformerDirectives from '@unocss/transformer-directives'
import transformerVariantGroup from '@unocss/transformer-variant-group'
import { minimatch } from 'minimatch'
import * as path from 'path'
import {
  parseClasses,
  parseClassExpression,
  parseCommentConfig,
  parseComments,
  parseMustache,
  stringifyAttr
} from './parser.js'
import platformPreflightsMap from './platform.js'
import { UnoCSSRNWebpackPlugin } from './rn-plugin/index.js'
import {
  getConcatSource,
  getRawSource,
  getReplaceSource
} from './source.js'
import {
  buildAliasTransformer,
  cssRequiresTransform,
  mpEscape,
  transformGroups,
  transformStyle
} from './transform.js'
import { UnoCSSWebpackPlugin } from './web-plugin/index.js'

const { isWeb, isReact } = env
const { has } = set
const { createCodeFrame, offsetToLoc, readSource } = sourceLocation
const { unescapeWxsObjectKey } = escapeWxsObjectKey

const PLUGIN_NAME = 'MpxUnocssPlugin'

/**
 * 在原始模板源码中定位类名。
 * 对象 key 基于 AST 偏移定位，避免误匹配源码中其他位置的相同文本。
 *
 * @param {string} source
 * @param {string} className
 * @param {boolean} objectKey
 * @returns {{start: number, end: number}|undefined}
 */
function findOriginalClassLoc (source, className, objectKey) {
  let result
  parseClasses(source).some(({ result: classValue, start }) => {
    if (!objectKey) {
      const index = classValue.indexOf(className)
      if (index > -1) {
        result = {
          start: start + index,
          end: start + index + className.length
        }
        return true
      }
      return false
    }
    const mustacheReg = /{{([\s\S]*?)}}/g
    let match
    while (match = mustacheReg.exec(classValue)) {
      const rawExp = match[1]
      const exp = rawExp.trim()
      const expStart = start + match.index + 2 + rawExp.indexOf(exp)
      const key = parseClassExpression(exp).objectKeys.find(key => String(key.result) === className)
      if (key) {
        const rawKey = exp.slice(key.start, key.end + 1)
        const valueStart = rawKey.indexOf(className)
        result = {
          start: expStart + key.start + Math.max(valueStart, 0),
          end: expStart + key.start + (valueStart > -1 ? valueStart + className.length : rawKey.length)
        }
        return true
      }
    }
    return false
  })
  return result
}

/**
 * 创建包含源码位置的 UnoCSS 编译错误。
 *
 * @param {string} msg
 * @param {{file?: string, source?: string, start?: number, end?: number}} options
 * @returns {Error}
 */
function createUnocssError (msg, { file, source, start, end } = {}) {
  let location = file
  let frame = ''
  if (source && start != null) {
    const loc = offsetToLoc(source, start, end)
    location += `:${loc.start.line}:${loc.start.column}`
    frame = createCodeFrame(source, loc)
  }
  return new Error(`[Mpx Unocss error]${location ? `[${location}]` : ''}: ${msg}${frame ? `\n\n${frame}` : ''}`)
}

function filterFile (file, scan) {
  const { include = [], exclude = [] } = scan
  for (const rule of exclude) {
    if (rule.test(file)) {
      return false
    }
  }

  for (const rule of include) {
    if (rule.test(file)) {
      return true
    }
  }

  return !include.length
}

function normalizeRules (rules, root) {
  if (!rules) return
  if (!Array.isArray(rules)) {
    rules = [rules]
  }
  return rules.map((rule) => {
    if (typeof rule.test === 'function') {
      return rule
    }
    if (typeof rule === 'string') {
      if (!(path.isAbsolute(rule) || rule.startsWith('**'))) {
        rule = path.join(root, rule)
      }
      rule = toPosix(rule)
      return {
        test: (file) => minimatch(file, rule, { dot: true })
      }
    }
    return false
  }).filter(i => i)
}

function normalizeOptions (options) {
  let {
    // 小程序特有的配置
    unoFile = 'styles/uno',
    styleIsolation = 'isolated',
    minCount = 2,
    scan = {
      include: [
        'src/**/*'
      ]
    },
    // 公共的配置
    root = process.cwd(),
    config,
    configFiles,
    transformCSS, // false  | true | { applyVariable: ['--at-apply'] }
    transformGroups, // false | true | { separators: [':','-'] }
    webOptions = {}
  } = options
  // 是否兼容为true的写法
  if (transformGroups) transformGroups = transformGroups instanceof Object ? transformGroups : {}
  if (transformCSS) transformCSS = transformCSS instanceof Object ? transformCSS : {}
  // web配置
  // todo config读取逻辑通过UnoCSSWebpackPlugin内置逻辑进行，待改进
  webOptions = {
    include: scan.include || [],
    exclude: scan.exclude || [],
    transformers: [
      ...transformGroups ? [transformerVariantGroup(transformGroups)] : [],
      ...transformCSS ? [transformerDirectives(transformCSS)] : []
    ],
    ...webOptions
  }

  scan.include = normalizeRules(scan.include, root)
  scan.exclude = normalizeRules(scan.exclude, root)

  return {
    unoFile,
    styleIsolation,
    minCount,
    scan,
    root,
    config,
    configFiles,
    transformCSS,
    transformGroups,
    webOptions
  }
}

function getCommonClassesMap (classesMaps, minCount) {
  const commonClassesMap = {}
  const allClassesMap = classesMaps.reduce((acc, cur) => Object.assign(acc, cur), {})

  Object.keys(allClassesMap).forEach((item) => {
    let count = 0
    for (const classesMap of classesMaps) {
      if (classesMap[item]) {
        count++
      }
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

function isProductionLikeMode (options) {
  return options.mode === 'production' || !options.mode
}

function getPlugin (compiler, curPlugin) {
  const plugins = compiler.options.plugins
  return plugins.find(plugin => Object.getPrototypeOf(plugin).constructor === curPlugin)
}

class MpxUnocssPlugin {
  constructor (options = {}) {
    this.options = normalizeOptions(options)
  }

  async generateStyle (uno, classes = [], options = {}) {
    const result = await uno.generate(new Set(classes), options)
    return mpEscape(result.css)
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

  async createContext (compilation, mode) {
    const { root, config, configFiles } = this.options
    const { config: resolved, sources } = await loadConfig(root, config, configFiles)
    sources.forEach((item) => {
      compilation.fileDependencies.add(item)
    })

    const platformPreflights = platformPreflightsMap[mode] || []

    return await createGenerator({
      ...resolved,
      preflights: [
        ...(resolved.preflights || []),
        ...platformPreflights
      ]
    })
  }

  getTemplateParser (uno) {
    // process classes
    const transformAlias = buildAliasTransformer(uno.config.alias)
    const transformClasses = (source, classNameHandler, unknownClassChars, loc) => {
      // pre process
      source = transformAlias(source)
      if (this.options.transformGroups) {
        source = transformGroups(source, this.options.transformGroups)
      }
      const content = source.source()
      // escape & fill classesMap
      return content.split(/\s+/).map((className) => {
        return mpEscape(cssEscape(classNameHandler(className)), (char) => {
          let chars = unknownClassChars.get(className)
          if (!chars) {
            chars = {
              value: new Set(),
              loc
            }
            unknownClassChars.set(className, chars)
          }
          chars.value.add(char)
        })
      }).join(' ')
    }
    return async (source, classNameHandler = c => c, error) => {
      // 单个模板内先去重，再由 UnoCSS 判断包含未知字符的类名是否有效
      const unknownClassChars = new Map()
      source = getReplaceSource(source)
      const content = source.original().source()
      parseClasses(content).forEach(({ result, start: attrStart, end: attrEnd }) => {
        let { replaced, val } = parseMustache(result, (exp) => {
          const expSource = getReplaceSource(exp)
          const { strings, objectKeys } = parseClassExpression(exp)
          strings.forEach(({ result, start, end }) => {
            result = transformClasses(result, classNameHandler, unknownClassChars, { start: attrStart, end: attrEnd })
            expSource.replace(start, end, result)
          })
          objectKeys.forEach(({ result, start, end }) => {
            if (typeof result === 'string') result = unescapeWxsObjectKey(result)
            if (typeof result !== 'string') {
              error && error(`Dynamic classname [${result}] can not be escaped as a valid identifier, which is not supported.`, { className: String(result), objectKey: true, start: attrStart, end: attrEnd })
              return
            }
            const className = transformClasses(result, classNameHandler, unknownClassChars, { objectKey: true, start: attrStart, end: attrEnd })
            const propertyName = escapeWxsObjectKey(className)
            if (!isValidIdentifierStr(propertyName)) {
              error && error(`Dynamic classname [${result}] can not be escaped as a valid identifier, which is not supported.`, { className: result, objectKey: true, start: attrStart, end: attrEnd })
            } else {
              expSource.replace(start, end, propertyName)
            }
          })
          return expSource.source()
        }, str => transformClasses(str, classNameHandler, unknownClassChars, { start: attrStart, end: attrEnd }))
        if (replaced) {
          val = stringifyAttr(val)
          source.replace(attrStart - 1, attrEnd + 1, val)
        }
      })
      await Promise.all(Array.from(unknownClassChars).map(async ([className, { value, loc }]) => {
        if (!await uno.parseToken(className)) {
          value.forEach((char) => {
            error && error(`Classname [${className}] contains unsupported character [${char}].`, Object.assign({ className }, loc))
          })
        }
      }))
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
      return {
        newsource: source,
        commentConfig
      }
    }
  }

  apply (compiler) {
    this.minify = isProductionLikeMode(compiler.options)
    // 处理web
    const mpxPluginInstance = getPlugin(compiler, MpxWebpackPlugin)
    if (!mpxPluginInstance) {
      const logger = compiler.getInfrastructureLogger(PLUGIN_NAME)
      logger.error(new Error('@mpxjs/unocss-plugin需要与@mpxjs/webpack-plugin配合使用，请检查!'))
      return
    }
    const mode = this.mode = mpxPluginInstance.options.mode
    if (isWeb(mode) || isReact(mode)) {
      const { webOptions } = this.options
      const WebpackPlugin = isReact(mode) ? UnoCSSRNWebpackPlugin : UnoCSSWebpackPlugin
      if (!getPlugin(compiler, WebpackPlugin)) {
        // todo 考虑使用options.config/configFiles读取配置对象后再与webOptions合并后传递给UnoCSSWebpackPlugin，保障读取的config对象与mp保持一致
        compiler.options.plugins.push(new WebpackPlugin(webOptions))
      }
      compiler.hooks.done.tap(PLUGIN_NAME, ({ compilation }) => {
        for (const dep of compilation.fileDependencies) {
          if (dep.includes('__uno.css')) {
            // 移除虚拟模块产生的fileDeps避免初始watch执行两次
            compilation.fileDependencies.delete(dep)
          }
        }
      })
    }
    compiler.hooks.thisCompilation.tap({
      name: PLUGIN_NAME,
      // 确保在MpxWebpackPlugin后执行，获取mpx对象
      stage: 1000
    }, (compilation) => {
      const { __mpx__: mpx } = compilation
      mpx.hasUnoCSS = true
      if (isWeb(mode) || isReact(mode)) return
      compilation.hooks.processAssets.tapPromise({
        name: PLUGIN_NAME,
        stage: compilation.PROCESS_ASSETS_STAGE_ADDITIONS
      }, async (assets) => {
        const error = (msg, options) => {
          compilation.errors.push(createUnocssError(msg, options))
        }
        // const warn = (msg) => {
        //   compilation.warnings.push(new Error(msg))
        // }
        const { mode, dynamicEntryInfo, appInfo, assetsModulesMap, independentSubpackagesMap } = mpx
        const uno = await this.createContext(compilation, mode)
        const config = uno.config

        const generateOptions = {
          preflights: false,
          safelist: false,
          minify: this.minify
        }
        // 包相关
        const packages = Object.keys(dynamicEntryInfo)

        function getPackageName (file) {
          file = toPosix(file)
          for (const packageName of packages) {
            if (packageName === 'main') {
              continue
            }
            if (file.startsWith(`${packageName}/`)) {
              return packageName
            }
          }
          return 'main'
        }
        // 处理wxss
        const processStyle = async (file, source) => {
          const content = source.source()
          if (!content || !(cssRequiresTransform(content, this.options.transformCSS))) return
          const output = await transformStyle(content, file, uno, this.options.transformCSS)
          if (!output || output.length <= 0) {
            error(`${file} 解析style错误,检查样式文件输入!`)
            return
          }
          assets[file] = getRawSource(output)
        }
        // 处理wxml
        const { template: templateExt, styles: styleExt } = mpxConfig[mode].typeExtMap
        const packageClassesMaps = {
          main: {}
        }
        const commentConfigMap = {}

        const mainClassesMap = packageClassesMaps.main
        // config中的safelist视为主包classes
        const safeListClasses = this.getSafeListClasses(config.safelist)

        safeListClasses.forEach((className) => {
          mainClassesMap[className] = true
        })
        const parseTemplate = this.getTemplateParser(uno)

        const processTemplate = async (file, source) => {
          const packageName = getPackageName(file)
          const filename = file.slice(0, -templateExt.length)
          const content = source.source()
          let resourcePath
          const assetModules = assetsModulesMap.get(file)
          // 一个模板产物可能关联多个模块，优先选择 type=template 的模块
          has(assetModules, (module) => {
            if (module.resource) {
              const request = parseRequest(module.resource)
              if (!resourcePath) {
                resourcePath = toPosix(request.resourcePath)
              }
              if (request.queryObj.type === 'template') {
                resourcePath = toPosix(request.resourcePath)
                return true
              }
            }
            return false
          })
          const resourceSource = readSource(resourcePath, compiler.inputFileSystem)
          const currentClassesMap = packageClassesMaps[packageName] = packageClassesMaps[packageName] || {}

          // process classes

          const classNameHandler = (className) => {
            if (!className) {
              return className
            }
            if (packageName === 'main') {
              mainClassesMap[className] = true
            } else if (!mainClassesMap[className]) {
              currentClassesMap[className] = true
            }
            return className
          }
          const getErrorOptions = (loc) => {
            const originalLoc = resourceSource && findOriginalClassLoc(resourceSource, loc.className, loc.objectKey)
            if (originalLoc) {
              return Object.assign({
                file: resourcePath,
                source: resourceSource
              }, originalLoc)
            }
            return Object.assign({ file, source: content }, loc)
          }
          const { newsource, commentConfig } = await parseTemplate(source, classNameHandler, (msg, loc) => {
            error(msg, getErrorOptions(loc))
          })
          commentConfigMap[filename] = commentConfig
          assets[file] = newsource
        }

        await Promise.all(Object.entries(assets).map(([file, source]) => {
          if (file.endsWith(styleExt) || file.endsWith(templateExt)) {
            const assetModules = assetsModulesMap.get(file)
            if (assetModules && has(assetModules, (module) => {
              if (module.resource) {
                const resourcePath = toPosix(parseRequest(module.resource).resourcePath)
                return filterFile(resourcePath, this.options.scan)
              }
              return false
            })) {
              if (this.options.transformCSS && file.endsWith(styleExt)) {
                return processStyle(file, source)
              }
              if (file.endsWith(templateExt)) {
                return processTemplate(file, source)
              }
            }
          }
          return Promise.resolve()
        }))
        delete packageClassesMaps.main
        // const commonClassesMap = getCommonClassesMap(Object.values(packageClassesMaps), this.options.minCount)
        const commonClassesMap = getCommonClassesMap(Object.entries(packageClassesMaps)
          .filter(([packageRoot, _]) => {
            // 独立分包中的classes不需要抽取到主包
            return !independentSubpackagesMap[packageRoot]
          })
          .map(([_, classesMap]) => {
            return classesMap
          }), this.options.minCount)
        Object.assign(mainClassesMap, commonClassesMap)
        // 生成主包uno.css
        let mainUnoFile
        const mainClasses = Object.keys(mainClassesMap)
        const mainUnoFileContent = await this.generateStyle(uno, mainClasses, {
          ...generateOptions,
          preflights: true
        })
        if (mainUnoFileContent) {
          mainUnoFile = this.options.unoFile + styleExt
          if (assets[mainUnoFile]) {
            error(`${mainUnoFile}当前已存在于[compilation.assets]中，请修改[options.unoFile]配置以规避冲突！`)
          }
          assets[mainUnoFile] = getRawSource(mainUnoFileContent)
        }

        if (mainUnoFile) {
          if (this.options.styleIsolation === 'isolated') {
            // isolated模式下无需全局样式注入
            dynamicEntryInfo.main && dynamicEntryInfo.main.entries.forEach(({ entryType, filename, resource }) => {
              if (entryType === 'page' || entryType === 'component') {
                const resourcePath = toPosix(parseRequest(resource).resourcePath)
                if (filterFile(resourcePath, this.options.scan)) {
                  const entryStyleFile = filename + styleExt
                  const mainRelativePath = fixRelative(toPosix(path.relative(path.dirname(entryStyleFile), mainUnoFile)), mode)
                  const entryStyleSource = getConcatSource(`@import ${JSON.stringify(mainRelativePath)};\n`)
                  entryStyleSource.add(assets[entryStyleFile] || '')
                  assets[entryStyleFile] = entryStyleSource
                }
              }
            })
          } else {
            const appStyleFile = appInfo.name + styleExt
            const mainRelativePath = fixRelative(toPosix(path.relative(path.dirname(appStyleFile), mainUnoFile)), mode)
            const appStyleSource = getConcatSource(`@import ${JSON.stringify(mainRelativePath)};\n`)
            appStyleSource.add(assets[appStyleFile] || '')
            assets[appStyleFile] = appStyleSource
            dynamicEntryInfo.main && dynamicEntryInfo.main.entries.forEach(({ entryType, filename }) => {
              const commentConfig = commentConfigMap[filename] || {}
              const styleIsolation = commentConfig.styleIsolation
              if (styleIsolation === 'isolated' && entryType === 'component') {
                const componentStyleFile = filename + styleExt
                const mainRelativePath = fixRelative(toPosix(path.relative(path.dirname(componentStyleFile), mainUnoFile)), mode)
                const componentStyleSource = getConcatSource(`@import ${JSON.stringify(mainRelativePath)};\n`)
                componentStyleSource.add(assets[componentStyleFile] || '')
                assets[componentStyleFile] = componentStyleSource
              }
            })
          }
        }
        // 生成分包uno.css
        await Promise.all(Object.entries(packageClassesMaps).map(async ([packageRoot, classesMap]) => {
          let unoFile
          const classes = Object.keys(classesMap)
          const unoFileContent = await this.generateStyle(uno, classes, {
            ...generateOptions,
            // 独立分包中的unocss文件生成preflights
            ...independentSubpackagesMap[packageRoot] ? { preflights: true } : null
          })
          if (unoFileContent) {
            unoFile = toPosix(path.join(packageRoot, this.options.unoFile + styleExt))
            if (assets[unoFile]) {
              error(`${unoFile}当前已存在于[compilation.assets]中，请修改[options.unoFile]配置以规避冲突！`)
            }
            assets[unoFile] = getRawSource(unoFileContent)
          }

          dynamicEntryInfo[packageRoot] && dynamicEntryInfo[packageRoot].entries.forEach(({
            entryType,
            filename,
            resource
          }) => {
            if (this.options.styleIsolation === 'isolated') {
              // isolated模式下无需全局样式注入
              if (entryType === 'page' || entryType === 'component') {
                const resourcePath = toPosix(parseRequest(resource).resourcePath)
                if (filterFile(resourcePath, this.options.scan)) {
                  const entryStyleFile = filename + styleExt
                  const entryStyleSource = getConcatSource('')
                  // 独立分包中的页面和组件无需引入mainUnoFile
                  if (mainUnoFile && !independentSubpackagesMap[packageRoot]) {
                    const mainRelativePath = fixRelative(toPosix(path.relative(path.dirname(entryStyleFile), mainUnoFile)), mode)
                    entryStyleSource.add(`@import ${JSON.stringify(mainRelativePath)};\n`)
                  }
                  if (unoFile) {
                    const relativePath = fixRelative(toPosix(path.relative(path.dirname(entryStyleFile), unoFile)), mode)
                    entryStyleSource.add(`@import ${JSON.stringify(relativePath)};\n`)
                  }
                  entryStyleSource.add(assets[entryStyleFile] || '')
                  assets[entryStyleFile] = entryStyleSource
                }
              }
            } else {
              if (entryType === 'page' && unoFile) {
                const pageStyleFile = filename + styleExt
                const relativePath = fixRelative(toPosix(path.relative(path.dirname(pageStyleFile), unoFile)), mode)
                const pageStyleSource = getConcatSource(`@import ${JSON.stringify(relativePath)};\n`)
                pageStyleSource.add(assets[pageStyleFile] || '')
                assets[pageStyleFile] = pageStyleSource
              }

              const commentConfig = commentConfigMap[filename] || {}
              const styleIsolation = commentConfig.styleIsolation
              if (styleIsolation === 'isolated' && entryType === 'component') {
                const componentStyleFile = filename + styleExt
                const componentStyleSource = getConcatSource('')
                // 独立分包中的页面和组件无需引入mainUnoFile
                if (mainUnoFile && !independentSubpackagesMap[packageRoot]) {
                  const mainRelativePath = fixRelative(toPosix(path.relative(path.dirname(componentStyleFile), mainUnoFile)), mode)
                  componentStyleSource.add(`@import ${JSON.stringify(mainRelativePath)};\n`)
                }
                if (unoFile) {
                  const relativePath = fixRelative(toPosix(path.relative(path.dirname(componentStyleFile), unoFile)), mode)
                  componentStyleSource.add(`@import ${JSON.stringify(relativePath)};\n`)
                }
                componentStyleSource.add(assets[componentStyleFile] || '')
                assets[componentStyleFile] = componentStyleSource
              }
            }
          })
        }))
      })
    })
  }
}

export default MpxUnocssPlugin
