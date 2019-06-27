const querystring = require('querystring')
const loaderUtils = require('loader-utils')
const normalize = require('./utils/normalize')
const tryRequire = require('./utils/try-require')
const styleCompilerPath = normalize.lib('style-compiler/index')
const templateCompilerPath = normalize.lib('template-compiler/index')
const jsonCompilerPath = normalize.lib('json-compiler/index')
const templatePreprocessorPath = normalize.lib('template-compiler/preprocessor')
const wxsLoaderPath = normalize.lib('wxs/wxs-loader')
const wxmlLoaderPath = normalize.lib('wxml/wxml-loader')
const config = require('./config')
const stringifyQuery = require('./utils/stringify-query')

// internal lib loaders
const selectorPath = normalize.lib('selector')
const extractorPath = normalize.lib('extractor')

// check whether default js loader exists
const hasBabel = !!tryRequire('babel-loader')

const rewriterInjectRE = /\b(css(?:-loader)?(?:\?[^!]+)?)(?:!|$)/

let count = 0

const defaultLang = {
  template: 'html',
  styles: 'css',
  script: 'js',
  json: 'json',
  wxs: 'wxs'
}

const postcssExtensions = [
  'postcss', 'pcss', 'sugarss', 'sss'
]

function getRawRequest ({ resource, loaderIndex, loaders }, excludedPreLoaders = /eslint-loader/) {
  return loaderUtils.getRemainingRequest({
    resource: resource,
    loaderIndex: loaderIndex,
    loaders: loaders.filter(loader => !excludedPreLoaders.test(loader.path))
  })
}

// sass => sass-loader
// sass-loader => sass-loader
// sass?indentedSyntax!css => sass-loader?indentedSyntax&!css-loader
function ensureLoader (lang) {
  return lang
    .split('!')
    .map(loader =>
      loader.replace(
        /^([\w-]+)(\?.*)?/,
        (_, name, query) =>
          (/-loader$/.test(name) ? name : name + '-loader') + (query || '')
      )
    )
    .join('!')
}

function ensureBang (loader) {
  if (loader && loader.charAt(loader.length - 1) !== '!') {
    return loader + '!'
  } else {
    return loader
  }
}

function resolveLoaders (options, moduleId, isProduction, hasScoped, hasComment, usingComponents, needCssSourceMap, projectRoot) {
  let cssLoaderOptions = ''
  let wxmlLoaderOptions = ''
  let jsonCompilerOptions = ''
  if (needCssSourceMap) {
    cssLoaderOptions += '?sourceMap'
  }
  if (isProduction) {
    cssLoaderOptions += (cssLoaderOptions ? '&' : '?') + 'minimize'
  }
  if (projectRoot) {
    wxmlLoaderOptions += '?root=' + projectRoot
    jsonCompilerOptions += '?root=' + projectRoot
  }

  const defaultLoaders = {
    html: wxmlLoaderPath + wxmlLoaderOptions,
    css: getCSSLoaderString(),
    js: hasBabel ? 'babel-loader' : '',
    json: jsonCompilerPath + jsonCompilerOptions,
    wxs: wxsLoaderPath
  }

  function getCSSLoaderString (lang) {
    const langLoader = lang ? ensureBang(ensureLoader(lang)) : ''
    return ensureBang('css-loader' + cssLoaderOptions) + langLoader
  }

  return {
    defaultLoaders,
    getCSSLoaderString,
    loaders: Object.assign({}, defaultLoaders, options.loaders),
    preLoaders: options.preLoaders || {},
    postLoaders: options.postLoaders || {}
  }
}

module.exports = function createHelpers (loaderContext, options, moduleId, isProduction, hasScoped, hasComment, usingComponents, needCssSourceMap, srcMode, isNative, projectRoot) {
  const rawRequest = getRawRequest(loaderContext, options.excludedPreLoaders)
  const {
    defaultLoaders,
    getCSSLoaderString,
    loaders,
    preLoaders,
    postLoaders
  } = resolveLoaders(
    options,
    moduleId,
    isProduction,
    hasScoped,
    hasComment,
    usingComponents,
    needCssSourceMap,
    projectRoot
  )

  function getRequire (type, part, index, scoped) {
    return 'require(' + getRequestString(type, part, index, scoped) + ')'
  }

  function getImport (type, part, index, scoped) {
    return (
      'import __' + type + '__ from ' +
      getRequestString(type, part, index, scoped)
    )
  }

  function getNamedExports (type, part, index, scoped) {
    return (
      'export * from ' +
      getRequestString(type, part, index, scoped)
    )
  }

  function addQueryMode (request, mode) {
    if (!mode) {
      return request
    }
    const queryIndex = request.indexOf('?')
    let query
    let resource = request
    if (queryIndex >= 0) {
      query = request.substr(queryIndex)
      resource = request.substr(0, queryIndex)
    }
    let queryObj = loaderUtils.parseQuery(query || '?')
    queryObj.mode = mode
    return resource + stringifyQuery(queryObj)
  }

  function getRequestString (type, part, index, scoped) {
    return loaderUtils.stringifyRequest(
      loaderContext,
      // disable all configuration loaders
      '!!' +
      // get loader string for pre-processors
      getLoaderString(type, part, index, scoped) +
      // select the corresponding part from the mpx file
      getSelectorString(type, index) +
      // the url to the actual mpx file, including remaining requests
      addQueryMode(rawRequest, part.mode)
    )
  }

  function getRequireForSrc (type, impt, index, scoped) {
    return 'require(' + getSrcRequestString(type, impt, index, scoped) + ')'
  }

  function getImportForSrc (type, impt, index, scoped) {
    return (
      'import __' + type + '__ from ' +
      getSrcRequestString(type, impt, index, scoped)
    )
  }

  function getNamedExportsForSrc (type, impt, index, scoped) {
    return (
      'export * from ' +
      getSrcRequestString(type, impt, index, scoped)
    )
  }

  function getSrcRequestString (type, impt, index, scoped) {
    return loaderUtils.stringifyRequest(
      loaderContext,
      '!!' + getLoaderString(type, impt, index, scoped) + addQueryMode(impt.src, impt.mode)
    )
  }

  function addCssModulesToLoader (loader, part, index) {
    if (!part.module) return loader
    const option = options.cssModules || {}
    const DEFAULT_OPTIONS = {
      modules: true
    }
    const OPTIONS = {
      localIdentName: '[hash:base64]',
      importLoaders: 1
    }
    return loader.replace(/((?:^|!)css(?:-loader)?)(\?[^!]*)?/, (m, $1, $2) => {
      // $1: !css-loader
      // $2: ?a=b
      const query = loaderUtils.parseQuery($2 || '?')
      Object.assign(query, OPTIONS, option, DEFAULT_OPTIONS)
      if (index !== -1) {
        query.localIdentName += '_' + index
      }
      return $1 + '?' + JSON.stringify(query)
    })
  }

  function buildCustomBlockLoaderString (attrs) {
    const noSrcAttrs = Object.assign({}, attrs)
    delete noSrcAttrs.src
    const qs = querystring.stringify(noSrcAttrs)
    return qs ? '?' + qs : qs
  }

  // stringify an Array of loader objects
  function stringifyLoaders (loaders) {
    return loaders
      .map(
        obj =>
          obj && typeof obj === 'object' && typeof obj.loader === 'string'
            ? obj.loader +
            (obj.options ? '?' + JSON.stringify(obj.options) : '')
            : obj
      )
      .join('!')
  }

  function getLoaderString (type, part, index, scoped) {
    let loader = getRawLoaderString(type, part, index, scoped)
    const lang = getLangString(type, part)
    if (type !== 'script' && type !== 'wxs') {
      loader = getExtractorString(type, index) + loader
    }
    if (preLoaders[lang]) {
      loader = loader + ensureBang(preLoaders[lang])
    }
    if (postLoaders[lang]) {
      loader = ensureBang(postLoaders[lang]) + loader
    }
    return loader
  }

  function getLangString (type, { lang }) {
    if (type === 'script' || type === 'template' || type === 'styles') {
      return lang || defaultLang[type]
    } else {
      return type
    }
  }

  function getRawLoaderString (type, part, index, scoped) {
    let lang = (part.lang && part.lang !== config[srcMode].typeExtMap.template.slice(1)) ? part.lang : defaultLang[type]

    let styleCompiler = ''
    if (type === 'styles') {
      // style compiler that needs to be applied for all styles
      styleCompiler = styleCompilerPath + '?' +
        JSON.stringify({
          id: moduleId,
          scoped: !!scoped,
          sourceMap: needCssSourceMap,
          transRpx: options.transRpx,
          comment: options.comment,
          designWidth: options.designWidth
        })
      // normalize scss/sass/postcss if no specific loaders have been provided
      if (!loaders[lang]) {
        if (postcssExtensions.indexOf(lang) !== -1) {
          lang = 'css'
        } else if (lang === 'sass') {
          lang = 'sass?indentedSyntax'
        } else if (lang === 'scss') {
          lang = 'sass'
        }
      }
    }

    let templateCompiler = ''

    if (type === 'template') {
      const templateCompilerOptions = {
        usingComponents,
        hasScoped,
        hasComment,
        isNative,
        moduleId,
        compileBindEvent: options.compileBindEvent,
        count: ++count
      }
      templateCompiler = templateCompilerPath + '?' + JSON.stringify(templateCompilerOptions)
    }

    let loader = type === 'styles'
      ? loaders[lang] || getCSSLoaderString(lang)
      : loaders[lang]

    if (loader != null) {
      if (Array.isArray(loader)) {
        loader = stringifyLoaders(loader)
      } else if (typeof loader === 'object') {
        loader = stringifyLoaders([loader])
      }
      if (type === 'styles') {
        // add css modules
        loader = addCssModulesToLoader(loader, part, index)
        // inject rewriter before css loader for extractTextPlugin use cases
        if (rewriterInjectRE.test(loader)) {
          loader = loader.replace(
            rewriterInjectRE,
            (m, $1) => ensureBang($1) + ensureBang(styleCompiler)
          )
        } else {
          loader = ensureBang(loader) + ensureBang(styleCompiler)
        }
      }

      if (type === 'template') {
        loader = ensureBang(loader) + ensureBang(templateCompiler)
      }

      return ensureBang(loader)
    } else {
      // unknown lang, infer the loader to be used
      switch (type) {
        case 'template':
          // allow passing options to the template preprocessor via `templateOption` option
          const preprocessorOption = { engine: lang, templateOption: options.templateOption || {} }
          const templatePreprocessor = templatePreprocessorPath + '?' + JSON.stringify(preprocessorOption)
          return ensureBang(defaultLoaders.html) + ensureBang(templateCompiler) + ensureBang(templatePreprocessor)
        case 'styles':
          loader = addCssModulesToLoader(defaultLoaders.css, part, index)
          return ensureBang(loader) + ensureBang(styleCompiler) + ensureBang(ensureLoader(lang))
        case 'script':
          return ensureBang(defaultLoaders.js) + ensureBang(ensureLoader(lang))
        default:
          loader = loaders[type]
          if (Array.isArray(loader)) {
            loader = stringifyLoaders(loader)
          }
          return ensureBang(loader + buildCustomBlockLoaderString(part.attrs))
      }
    }
  }

  function getSelectorString (type, index = 0) {
    return ensureBang(
      selectorPath +
      '?type=' +
      (type === 'script' || type === 'template' || type === 'styles' || type === 'json'
        ? type
        : 'customBlocks') +
      '&index=' + index
    )
  }

  function getExtractorString (type, index = 0) {
    return ensureBang(
      extractorPath +
      '?type=' +
      (type === 'script' || type === 'template' || type === 'styles' || type === 'json'
        ? type
        : 'customBlocks') +
      '&index=' + index +
      '&resource=' + loaderContext.resource
    )
  }

  return {
    loaders,
    getRequire,
    getImport,
    getNamedExports,
    getRequireForSrc,
    getImportForSrc,
    getNamedExportsForSrc,
    getRequestString,
    getSrcRequestString
  }
}
