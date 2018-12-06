const querystring = require('querystring')
const loaderUtils = require('loader-utils')
const normalize = require('./utils/normalize')
const tryRequire = require('./utils/try-require')
const styleCompilerPath = normalize.lib('style-compiler/index')
const templateCompilerPath = normalize.lib('template-compiler/index')
const jsonCompilerPath = normalize.lib('json-compiler/index')

// internal lib loaders
const selectorPath = normalize.lib('selector')
const extractorPath = normalize.lib('extractor')

// check whether default js loader exists
const hasBabel = !!tryRequire('babel-loader')

const rewriterInjectRE = /\b(css(?:-loader)?(?:\?[^!]+)?)(?:!|$)/

const defaultLang = {
  template: 'html',
  styles: 'css',
  script: 'js',
  json: 'json'
}

const postcssExtensions = [
  'postcss', 'pcss', 'sugarss', 'sss'
]

function getRawRequest ({resource, loaderIndex, loaders}, excludedPreLoaders = /eslint-loader/) {
  return loaderUtils.getRemainingRequest({
    resource: resource,
    loaderIndex: loaderIndex,
    loaders: loaders.filter(loader => !excludedPreLoaders.test(loader.path))
  })
}

// sass => sass-loader
// sass-loader => sass-loader
// sass?indentedSyntax!css => sass-loader?indentedSyntax!css-loader
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
  if (loader.charAt(loader.length - 1) !== '!') {
    return loader + '!'
  } else {
    return loader
  }
}

function resolveLoaders (options, moduleId, isProduction, hasScoped, hasComment, usingComponents, needCssSourceMap) {
  let cssLoaderOptions = ''
  if (needCssSourceMap) {
    cssLoaderOptions += '?sourceMap'
  }
  if (isProduction) {
    cssLoaderOptions += (cssLoaderOptions ? '&' : '?') + 'minimize'
  }

  const templateCompilerOptions =
    '?' +
    JSON.stringify({
      usingComponents,
      hasComment,
      moduleId,
      compileBindEvent: options.compileBindEvent
    })

  const defaultLoaders = {
    html: 'html-loader?attrs=audio:src image:src video:src cover-image:src' + '!' + templateCompilerPath + templateCompilerOptions,
    css: getCSSLoaderString(),
    js: hasBabel ? 'babel-loader' : '',
    json: jsonCompilerPath
  }

  function getCSSLoaderString (lang) {
    const langLoader = lang ? ensureBang(ensureLoader(lang)) : ''
    return 'css-loader' + cssLoaderOptions + '!' + langLoader
  }

  return {
    defaultLoaders,
    getCSSLoaderString,
    loaders: Object.assign({}, defaultLoaders, options.loaders),
    preLoaders: options.preLoaders || {},
    postLoaders: options.postLoaders || {}
  }
}

module.exports = function createHelpers (loaderContext, options, moduleId, parts, isProduction, hasScoped, hasComment, usingComponents, needCssSourceMap) {
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
    needCssSourceMap
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

  function getRequestString (type, part, index, scoped) {
    return loaderUtils.stringifyRequest(
      loaderContext,
      // disable all configuration loaders
      '!!' +
      // get loader string for pre-processors
      getLoaderString(type, part, index, scoped) +
      // select the corresponding part from the mpx file
      getSelectorString(type, index || 0) +
      // the url to the actual mpx file, including remaining requests
      rawRequest
    )
  }

  function getRequireForSrc (type, impt, scoped) {
    return 'require(' + getSrcRequestString(type, impt, scoped) + ')'
  }

  function getImportForSrc (type, impt, scoped) {
    return (
      'import __' + type + '__ from ' +
      getSrcRequestString(type, impt, scoped)
    )
  }

  function getNamedExportsForSrc (type, impt, scoped) {
    return (
      'export * from ' +
      getSrcRequestString(type, impt, scoped)
    )
  }

  function getSrcRequestString (type, impt, scoped) {
    return loaderUtils.stringifyRequest(
      loaderContext,
      '!!' + getLoaderString(type, impt, -1, scoped) + impt.src
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
    if (type !== 'script') {
      loader = getExtractorString(type, index || 0) + loader
    }
    if (preLoaders[lang]) {
      loader = loader + ensureBang(preLoaders[lang])
    }
    if (postLoaders[lang]) {
      loader = ensureBang(postLoaders[lang]) + loader
    }
    return loader
  }

  function getLangString (type, {lang}) {
    if (type === 'script' || type === 'template' || type === 'styles') {
      return lang || defaultLang[type]
    } else {
      return type
    }
  }

  function getRawLoaderString (type, part, index, scoped) {
    let lang = part.lang || defaultLang[type]

    let styleCompiler = ''
    if (type === 'styles') {
      // style compiler that needs to be applied for all styles
      styleCompiler =
        styleCompilerPath +
        '?' +
        JSON.stringify({
          id: moduleId,
          scoped: !!scoped,
          sourceMap: needCssSourceMap,
          transRpx: options.transRpx,
          comment: options.comment || 'use rpx'
        }) +
        '!'
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
            (m, $1) => ensureBang($1) + styleCompiler
          )
        } else {
          loader = ensureBang(loader) + styleCompiler
        }
      }
      // if user defines custom loaders for html, add template compiler to it
      if (type === 'template' && loader.indexOf(defaultLoaders.html) < 0) {
        loader = defaultLoaders.html + '!' + loader
      }
      return ensureBang(loader)
    } else {
      // unknown lang, infer the loader to be used
      switch (type) {
        case 'template':
          return (
            defaultLoaders.html + '!'
          )
        case 'styles':
          loader = addCssModulesToLoader(defaultLoaders.css, part, index)
          return loader + '!' + styleCompiler + ensureBang(ensureLoader(lang))
        case 'script':
          return ensureBang(ensureLoader(lang))
        default:
          loader = loaders[type]
          if (Array.isArray(loader)) {
            loader = stringifyLoaders(loader)
          }
          return ensureBang(loader + buildCustomBlockLoaderString(part.attrs))
      }
    }
  }

  function getSelectorString (type, index) {
    return (
      selectorPath +
      '?type=' +
      (type === 'script' || type === 'template' || type === 'styles' || type === 'json'
        ? type
        : 'customBlocks') +
      '&index=' + index +
      '!'
    )
  }

  function getExtractorString (type, index) {
    return (
      extractorPath +
      '?type=' +
      (type === 'script' || type === 'template' || type === 'styles' || type === 'json'
        ? type
        : 'customBlocks') +
      '&index=' + index +
      '!'
    )
  }

  function validateJsonByType (json, type) {
    let warnings = []

    if (!json) {
      // page和component允许json为空，但是app必须有json
      if (type === 'page' || type === 'component') {
        return {
          type: 'success'
        }
      } else if (type === 'app') {
        return {
          type: 'error',
          message: 'App entry must have a json field, now is undefined.'
        }
      }
    }

    const knownConfigs = {
      'app': {
        'pages': Array,
        'window': Object,
        'tooBar': Object,
        'networkTimeout': Object,
        'debug': Boolean,
        'plugins': Object
      },
      'component': {
        'component': Boolean,
        'usingComponents': Object
      },
      'page': {
        'navigationBarBackgroundColor': String,
        'navigationBarTextStyle': String,
        'navigationBarTitleText': String,
        'navigationStyle': String,
        'backgroundColor': String,
        'backgroundTextStyle': String,
        'backgroundColorTop': String,
        'backgroundColorBottom': String,
        'enablePullDownRefresh': String,
        'onReachBottomDistance': String,
        'usingComponents': Object
      }
    }

    if (!(type in knownConfigs)) {
      return {
        type: 'success'
      }
    }

    let config = knownConfigs[type]

    let jsonObj
    try {
      jsonObj = JSON.parse(json.content)
    } catch (e) {
      return {
        type: 'error',
        message: 'fail to parse'
      }
    }

    if (typeof jsonObj !== 'object') {
      return {
        type: 'error',
        message: 'invalid format, config should be Object'
      }
    }

    for (let i in jsonObj) {
      if (!(i in config)) {
        warnings.push({
          type: 'warn',
          message: `Maybe config [${i}] is not a valid weixin miniapp config.`
        })
      } else {
        let currentType = Object.prototype.toString.call(jsonObj[i]).slice(8, -1)
        let configType = config[i].name
        if (currentType !== configType) {
          return {
            type: 'error',
            message: `Expect the type of config [${i}] to be ${configType} but got ${currentType}`
          }
        }
      }
    }
    return warnings
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
    getSrcRequestString,
    validateJsonByType
  }
}
