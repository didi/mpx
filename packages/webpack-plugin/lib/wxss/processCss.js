/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
  Modified by @hiyuki
*/
const formatCodeFrame = require('@babel/code-frame')
const Tokenizer = require('css-selector-tokenizer')
const postcss = require('postcss')
const loaderUtils = require('loader-utils')
const assign = require('object-assign')
const getLocalIdent = require('./getLocalIdent')

const icssUtils = require('icss-utils')
const localByDefault = require('postcss-modules-local-by-default')
const extractImports = require('postcss-modules-extract-imports')
const modulesScope = require('postcss-modules-scope')
const modulesValues = require('postcss-modules-values')
const valueParser = require('postcss-value-parser')
const isUrlRequest = require('../utils/is-url-request')

const parserPlugin = postcss.plugin('css-loader-parser', function (options) {
  return function (css) {
    const imports = {}
    let exports = {}
    const importItems = []
    const urlItems = []

    function replaceImportsInString (str) {
      if (options.import) {
        const tokens = valueParser(str)
        tokens.walk(function (node) {
          if (node.type !== 'word') {
            return
          }
          const token = node.value
          const importIndex = imports['$' + token]
          if (typeof importIndex === 'number') {
            node.value = '___CSS_LOADER_IMPORT___' + importIndex + '___'
          }
        })
        return tokens.toString()
      }
      return str
    }

    if (options.import) {
      css.walkAtRules(/^import$/i, function (rule) {
        const values = Tokenizer.parseValues(rule.params)
        let url = values.nodes[0].nodes[0]
        if (url && url.type === 'url') {
          url = url.url
        } else if (url && url.type === 'string') {
          url = url.value
        } else throw rule.error('Unexpected format ' + rule.params)
        if (!url.replace(/\s/g, '').length) {
          return
        }
        values.nodes[0].nodes.shift()
        const mediaQuery = Tokenizer.stringifyValues(values)

        if (isUrlRequest(url, options.root)) {
          url = loaderUtils.urlToRequest(url, options.root)
        }

        importItems.push({
          url: url,
          mediaQuery: mediaQuery
        })
        rule.remove()
      })
    }

    const icss = icssUtils.extractICSS(css)
    exports = icss.icssExports
    Object.keys(icss.icssImports).forEach(function (key) {
      const url = loaderUtils.parseString(key)
      Object.keys(icss.icssImports[key]).forEach(function (prop) {
        imports['$' + prop] = importItems.length
        importItems.push({
          url: url,
          export: icss.icssImports[key][prop]
        })
      })
    })

    Object.keys(exports).forEach(function (exportName) {
      exports[exportName] = replaceImportsInString(exports[exportName])
    })

    function isAlias (url) {
      // Handle alias starting by / and root disabled
      return url !== options.resolve(url)
    }

    function processNode (item) {
      switch (item.type) {
        case 'value':
          item.nodes.forEach(processNode)
          break
        case 'nested-item':
          item.nodes.forEach(processNode)
          break
        case 'item':
          const importIndex = imports['$' + item.name]
          if (typeof importIndex === 'number') {
            item.name = '___CSS_LOADER_IMPORT___' + importIndex + '___'
          }
          break
        case 'url':
          if (options.url && item.url.replace(/\s/g, '').length && !/^#/.test(item.url) && (isAlias(item.url) || isUrlRequest(item.url, options.root))) {
            // Strip quotes, they will be re-added if the module needs them
            item.stringType = ''
            delete item.innerSpacingBefore
            delete item.innerSpacingAfter
            const url = item.url
            item.url = '___CSS_LOADER_URL___' + urlItems.length + '___'
            urlItems.push({
              url: url
            })
          }
          break
      }
    }

    css.walkDecls(function (decl) {
      const values = Tokenizer.parseValues(decl.value)
      values.nodes.forEach(function (value) {
        value.nodes.forEach(processNode)
      })
      decl.value = Tokenizer.stringifyValues(values)
    })
    css.walkAtRules(function (atrule) {
      if (typeof atrule.params === 'string') {
        atrule.params = replaceImportsInString(atrule.params)
      }
    })

    options.importItems = importItems
    options.urlItems = urlItems
    options.exports = exports
  }
})

module.exports = function processCss (inputSource, inputMap, options, callback) {
  const query = options.query
  const root = query.root && query.root.length > 0 ? query.root.replace(/\/$/, '') : query.root
  const context = query.context
  const localIdentName = query.localIdentName || '[hash:base64]'
  const localIdentRegExp = query.localIdentRegExp
  const forceMinimize = query.minimize
  const minimize = typeof forceMinimize !== 'undefined' ? !!forceMinimize : options.minimize

  const customGetLocalIdent = query.getLocalIdent || getLocalIdent

  const parserOptions = {
    root: root,
    mode: options.mode,
    url: query.url !== false,
    import: query.import !== false,
    resolve: options.resolve
  }

  const pipeline = postcss([
    modulesValues,
    localByDefault({
      mode: options.mode,
      rewriteUrl: function (global, url) {
        if (parserOptions.url) {
          url = url.trim()

          if (!url.replace(/\s/g, '').length || !isUrlRequest(url, root)) {
            return url
          }
          if (global) {
            return loaderUtils.urlToRequest(url, root)
          }
        }
        return url
      }
    }),
    extractImports(),
    modulesScope({
      generateScopedName: function generateScopedName (exportName) {
        return customGetLocalIdent(options.loaderContext, localIdentName, exportName, {
          regExp: localIdentRegExp,
          hashPrefix: query.hashPrefix || '',
          context: context
        })
      }
    }),
    parserPlugin(parserOptions)
  ])

  if (minimize) {
    const cssnano = require('cssnano')
    const minimizeOptions = assign({}, query.minimize);
    ['zindex', 'normalizeUrl', 'discardUnused', 'mergeIdents', 'reduceIdents', 'autoprefixer', 'svgo'].forEach(function (name) {
      if (typeof minimizeOptions[name] === 'undefined') {
        minimizeOptions[name] = false
      }
    })
    pipeline.use(cssnano(minimizeOptions))
  }

  pipeline.process(inputSource, {
    // we need a prefix to avoid path rewriting of PostCSS
    from: '/css-loader!' + options.from,
    to: options.to,
    map: options.sourceMap ? {
      prev: inputMap,
      sourcesContent: true,
      inline: false,
      annotation: false
    } : null
  }).then(function (result) {
    callback(null, {
      source: result.css,
      map: result.map && result.map.toJSON(),
      exports: parserOptions.exports,
      importItems: parserOptions.importItems,
      importItemRegExpG: /___CSS_LOADER_IMPORT___([0-9]+)___/g,
      importItemRegExp: /___CSS_LOADER_IMPORT___([0-9]+)___/,
      urlItems: parserOptions.urlItems,
      urlItemRegExpG: /___CSS_LOADER_URL___([0-9]+)___/g,
      urlItemRegExp: /___CSS_LOADER_URL___([0-9]+)___/
    })
  }).catch(function (err) {
    if (err.name === 'CssSyntaxError') {
      const wrappedError = new CSSLoaderError(
        'Syntax Error',
        err.reason,
        err.line != null && err.column != null
          ? { line: err.line, column: err.column }
          : null,
        err.input.source
      )
      callback(wrappedError)
    } else {
      callback(err)
    }
  })
}

function formatMessage (message, loc, source) {
  let formatted = message
  if (loc) {
    formatted = formatted +
      ' (' + loc.line + ':' + loc.column + ')'
  }
  if (loc && source) {
    formatted = formatted +
      '\n\n' + formatCodeFrame(source, loc.line, loc.column) + '\n'
  }
  return formatted
}

function CSSLoaderError (name, message, loc, source, error) {
  Error.call(this)
  Error.captureStackTrace(this, CSSLoaderError)
  this.name = name
  this.error = error
  this.message = formatMessage(message, loc, source)
  this.message = formatMessage(message, loc, source)
}

CSSLoaderError.prototype = Object.create(Error.prototype)
CSSLoaderError.prototype.constructor = CSSLoaderError
