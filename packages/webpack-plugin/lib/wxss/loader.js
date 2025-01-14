/* eslint-disable operator-linebreak */
/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
// base on css-loader@6.7.1

const postcss = require('postcss')
const postcssPkg = require('postcss/package.json')
const { satisfies } = require('semver')

const CssSyntaxError = require('./CssSyntaxError')
const Warning = require('./Warning')
const schema = require('./options.json')
const { icssParser, importParser, urlParser } = require('./plugins')
const {
  normalizeOptions,
  shouldUseModulesPlugins,
  shouldUseImportPlugin,
  shouldUseURLPlugin,
  shouldUseIcssPlugin,
  getPreRequester,
  getExportCode,
  getFilter,
  getImportCode,
  getModuleCode,
  getModulesPlugins,
  normalizeSourceMap,
  sort,
  combineRequests,
  stringifyRequest
} = require('./utils')
const createHelpers = require('../helpers')

const RN_PRESET_OPTIMISATION = {
  reduceInitial: false,
  normalizeWhitespace: false,
  minifyFontValues: false,
  convertValues: false
}

module.exports = async function loader (content, map, meta) {
  const rawOptions = this.getOptions(schema)
  const plugins = []
  const callback = this.async()

  const mpx = this.getMpx()
  const externals = mpx.externals
  const root = mpx.projectRoot
  const sourceMap = mpx.cssSourceMap || false
  const isRN = ['ios', 'android'].includes(mpx.mode)

  let options

  try {
    options = normalizeOptions(Object.assign({}, rawOptions, { sourceMap }), this)
  } catch (error) {
    callback(error)

    return
  }

  const replacements = []
  const exports = []

  if (shouldUseModulesPlugins(options)) {
    plugins.push(...getModulesPlugins(options, this))
  }

  const importPluginImports = []
  const importPluginApi = []

  let isSupportAbsoluteURL = false

  // TODO enable by default in the next major release
  if (
    this._compilation &&
    this._compilation.options &&
    this._compilation.options.experiments &&
    this._compilation.options.experiments.buildHttp
  ) {
    isSupportAbsoluteURL = true
  }
  const isSupportDataURL =
    options.esModule && Boolean('fsStartTime' in this._compiler)

  if (shouldUseImportPlugin(options)) {
    const { getRequestString } = createHelpers(this)
    plugins.push(
      importParser({
        isSupportAbsoluteURL: false,
        isSupportDataURL: false,
        externals,
        root,
        isCSSStyleSheet: options.exportType === 'css-style-sheet',
        loaderContext: this,
        imports: importPluginImports,
        api: importPluginApi,
        filter: options.import.filter,
        urlHandler: (url) => {
          url = combineRequests(getPreRequester(this)(options.importLoaders), url)
          return getRequestString('styles', { src: url }, {
            isStatic: true,
            issuerResource: this.resource,
            fromImport: true
          })
        }
      })
    )
  }

  const urlPluginImports = []

  if (shouldUseURLPlugin(options)) {
    const needToResolveURL = !options.esModule

    plugins.push(
      urlParser({
        isSupportAbsoluteURL,
        isSupportDataURL,
        externals,
        root,
        imports: urlPluginImports,
        replacements,
        context: this.context,
        rootContext: this.rootContext,
        filter: getFilter(options.url.filter, this.resourcePath),
        resolver: needToResolveURL
          ? this.getResolve({ mainFiles: [], extensions: [] })
          : // eslint-disable-next-line no-undefined
          undefined,
        urlHandler: (url) => stringifyRequest(this, url)
        // Support data urls as input in new URL added in webpack@5.38.0
      })
    )
  }

  const icssPluginImports = []
  const icssPluginApi = []

  const needToUseIcssPlugin = shouldUseIcssPlugin(options)

  if (needToUseIcssPlugin) {
    plugins.push(
      icssParser({
        loaderContext: this,
        imports: icssPluginImports,
        api: icssPluginApi,
        replacements,
        exports,
        urlHandler: (url) =>
          stringifyRequest(
            this,
            combineRequests(getPreRequester(this)(options.importLoaders), url)
          )
      })
    )
  }

  if (this.minimize) {
    const cssnano = require('cssnano')
    const minimizeOptions = rawOptions.minimize || {}
    const presetOptimisation = Object.assign(
      {},
      isRN ? RN_PRESET_OPTIMISATION : {},
      minimizeOptions.optimisation
    )
    let cssnanoConfig = {
      preset: ['cssnano-preset-default', presetOptimisation]
    }
    if (minimizeOptions.advanced) {
      cssnanoConfig = {
        preset: ['cssnano-preset-advanced', presetOptimisation]
      }
    }
    plugins.push(cssnano(cssnanoConfig))
  }

  // Reuse CSS AST (PostCSS AST e.g 'postcss-loader') to avoid reparsing
  if (meta) {
    const { ast } = meta

    if (
      ast &&
      ast.type === 'postcss' &&
      satisfies(ast.version, `^${postcssPkg.version}`)
    ) {
      // eslint-disable-next-line no-param-reassign
      content = ast.root
    }
  }

  const { resourcePath } = this

  let result

  try {
    result = await postcss(plugins).process(content, {
      hideNothingWarning: true,
      from: resourcePath,
      to: resourcePath,
      map: options.sourceMap
        ? {
            prev: map ? normalizeSourceMap(map, resourcePath) : null,
            inline: false,
            annotation: false
          }
        : false
    })
  } catch (error) {
    if (error.file) {
      this.addDependency(error.file)
    }

    callback(
      error.name === 'CssSyntaxError' ? new CssSyntaxError(error) : error
    )

    return
  }

  for (const warning of result.warnings()) {
    this.emitWarning(new Warning(warning))
  }

  const imports = []
    .concat(icssPluginImports.sort(sort))
    .concat(importPluginImports.sort())
    .concat(urlPluginImports.sort(sort))

  const api = []
    .concat(importPluginApi.sort(sort))
    .concat(icssPluginApi.sort(sort))

  if (options.modules.exportOnlyLocals !== true) {
    imports.unshift({
      type: 'api_import',
      importName: '___CSS_LOADER_API_IMPORT___',
      url: stringifyRequest(this, '!!' + require.resolve('./runtime/api'))
    })

    if (options.sourceMap) {
      imports.unshift({
        importName: '___CSS_LOADER_API_SOURCEMAP_IMPORT___',
        url: stringifyRequest(this, '!!' + require.resolve('./runtime/sourceMaps'))
      })
    } else {
      imports.unshift({
        importName: '___CSS_LOADER_API_NO_SOURCEMAP_IMPORT___',
        url: stringifyRequest(this, '!!' + require.resolve('./runtime/noSourceMaps'))
      })
    }
  }

  const importCode = getImportCode(imports, options)

  let moduleCode

  try {
    moduleCode = getModuleCode(result, api, replacements, options, this)
  } catch (error) {
    callback(error)

    return
  }

  const exportCode = getExportCode(
    exports,
    replacements,
    needToUseIcssPlugin,
    options
  )

  callback(null, `${importCode}${moduleCode}${exportCode}`)
}
