const { Processor } = require('windicss/lib')
const { HTMLParser } = require('windicss/utils/parser')
const { ReplaceSource, RawSource, ConcatSource } = require('webpack').sources
const config = require('@mpxjs/webpack-plugin/lib/config')
const toPosix = require('@mpxjs/webpack-plugin/lib/utils/to-posix')
const fixRelative = require('@mpxjs/webpack-plugin/lib/utils/fix-relative')
const path = require('path')

function normalizeOptions (options) {
  options.windiFile = options.windiFile || 'styles/windi'
  options.minify = options.minify || false
  return options
}

const mpEscapeMap = {
  '(': '_pl_',
  ')': '_pr_',
  '[': '_bl_',
  ']': '_br_',
  '#': '_h_',
  '!': '_i_',
  '/': '_s_',
  '.': '_d_',
  ':': '_c_',
  '2c': '_2c_',
  '%': '_p_',
  '\'': '_q_',
  '"': '_dq_',
  '+': '_a_'

}

const escapeReg = /\\(2c|.)/g

function mpEscape (str) {
  return str.replace(escapeReg, (_, p1) => {
    if (mpEscapeMap[p1]) return mpEscapeMap[p1]
    // unknown escape
    return '_u_'
  })
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
    this.processor = new Processor()
  }

  generateStyle (classesMap) {
    const classes = Object.keys(classesMap).join(' ')
    const styleSheet = this.processor.interpret(classes).styleSheet
    styleSheet.children.forEach((style) => {
      if (style.selector) {
        style.selector = mpEscape(style.selector)
      }
    })
    return styleSheet.build(this.options.minify)
  }

  apply (compiler) {
    compiler.hooks.thisCompilation.tap('MpxWindicssPlugin', (compilation) => {
      compilation.hooks.processAssets.tap({
        name: 'MpxWindicssPlugin',
        stage: compilation.PROCESS_ASSETS_STAGE_ADDITIONS
      }, (assets) => {
        const { __mpx__: mpx } = compilation
        if (!mpx) {
          compilation.errors.push(new Error(`@mpxjs/windicss-plugin需要与@mpxjs/webpack-plugin配合使用，请检查!`))
          return
        }

        const { mode, dynamicEntryInfo, appInfo } = mpx

        // 输出web时暂不处理
        if (mode === 'web') return

        const { template: templateExt, styles: styleExt } = config[mode].typeExtMap

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

        Object.entries(assets).forEach(([filename, source]) => {
          if (!filename.endsWith(templateExt)) return

          const resultSource = new ReplaceSource(source)

          const content = source.source()

          const parser = new HTMLParser(content)

          const packageName = getPackageName(filename)

          const currentClassesMap = packageClassesMaps[packageName] = packageClassesMaps[packageName] || {}

          const temp = parser.parseClasses()
          temp.forEach(({ start, end, result }) => {
            const escaped = mpEscape(this.processor.e(result))
            resultSource.replace(start, end, escaped)

            result.split(/\s+/).forEach((item) => {
              if (packageName === 'main') {
                mainClassesMap[item] = true
              } else if (!mainClassesMap[item]) {
                currentClassesMap[item] = true
              }
            })
          })

          assets[filename] = resultSource
        })

        delete packageClassesMaps.main
        const commonClassesMap = getCommonClassesMap(Object.values(packageClassesMaps))
        Object.assign(mainClassesMap, commonClassesMap)

        const windiFileContent = this.generateStyle(mainClassesMap)
        const windiFile = this.options.windiFile + styleExt


        // 处理主包
        if (assets[windiFile]) compilation.errors.push(new Error(`${windiFile}当前已存在于[compilation.assets]中，请修改[options.windiFile]配置以规避冲突！`))
        assets[windiFile] = new RawSource(windiFileContent)

        const appFile = appInfo.name + styleExt
        let relativePath = toPosix(path.relative(path.dirname(appFile), windiFile))
        relativePath = fixRelative(relativePath, mode)
        const appStyleSource = new ConcatSource(`@import ${JSON.stringify(relativePath)};\n`)
        appStyleSource.add(assets[appFile] || '')
        assets[appFile] = appStyleSource

        Object.entries(packageClassesMaps).forEach(([packageRoot, classesMap]) => {
          const windiFileContent = this.generateStyle(classesMap)
          const windiFile = toPosix(path.join(packageRoot, this.options.windiFile + styleExt))

          if (assets[windiFile]) compilation.errors.push(new Error(`${windiFile}当前已存在于[compilation.assets]中，请修改[options.windiFile]配置以规避冲突！`))
          assets[windiFile] = new RawSource(windiFileContent)

          dynamicEntryInfo[packageRoot].entries.forEach(({ entryType, filename }) => {
            if (entryType === 'page') {
              const pageFile = filename + styleExt
              let relativePath = toPosix(path.relative(path.dirname(pageFile), windiFile))
              relativePath = fixRelative(relativePath, mode)
              const pageStyleSource = new ConcatSource(`@import ${JSON.stringify(relativePath)};\n`)
              pageStyleSource.add(assets[appFile] || '')
              assets[pageFile] = pageStyleSource
            }
          })
        })
      })
    })
  }
}

module.exports = MpxWindicssPlugin
