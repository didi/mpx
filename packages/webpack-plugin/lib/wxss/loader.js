/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
  Modified by @hiyuki
*/
const loaderUtils = require('loader-utils')
const processCss = require('./processCss')
const getImportPrefix = require('./getImportPrefix')
const compileExports = require('./compile-exports')
const createResolver = require('./createResolver')
const isUrlRequest = require('../utils/is-url-request')
const getMainCompilation = require('../utils/get-main-compilation')
const addQuery = require('../utils/add-query')

module.exports = function (content, map) {
  if (this.cacheable) this.cacheable()

  const callback = this.async()
  const query = loaderUtils.getOptions(this) || {}
  const root = query.root
  const moduleMode = query.modules || query.module
  const camelCaseKeys = query.camelCase || query.camelcase
  const sourceMap = query.sourceMap || false
  const resolve = createResolver(query.alias)
  const mpx = getMainCompilation(this._compilation).__mpx__
  const externals = mpx.externals

  if (sourceMap) {
    if (map) {
      if (typeof map === 'string') {
        map = JSON.stringify(map)
      }

      if (map.sources) {
        map.sources = map.sources.map(function (source) {
          return source.replace(/\\/g, '/')
        })
        map.sourceRoot = ''
      }
    }
  } else {
    // Some loaders (example `"postcss-loader": "1.x.x"`) always generates source map, we should remove it
    map = null
  }

  processCss(content, map, {
    mode: moduleMode ? 'local' : 'global',
    from: loaderUtils.getRemainingRequest(this).split('!').pop(),
    to: loaderUtils.getCurrentRequest(this).split('!').pop(),
    query: query,
    resolve: resolve,
    minimize: this.minimize,
    loaderContext: this,
    sourceMap: sourceMap
  }, function (err, result) {
    if (err) return callback(err)

    let cssAsString = JSON.stringify(result.source)

    // for importing CSS
    const importUrlPrefix = getImportPrefix(this)

    const alreadyImported = {}
    const importJs = result.importItems.filter(function (imp) {
      if (!imp.mediaQuery) {
        if (alreadyImported[imp.url]) {
          return false
        }
        alreadyImported[imp.url] = true
      }
      return true
    }).map(function (imp) {
      if (!isUrlRequest(imp.url, root) || externals.some((external) => {
        if (typeof external === 'string') {
          return external === imp.url
        } else if (external instanceof RegExp) {
          return external.test(imp.url)
        }
        return false
      })) {
        return 'exports.push([module.id, ' +
          JSON.stringify('@import url(' + imp.url + ');') + ', ' +
          JSON.stringify(imp.mediaQuery) + ']);'
      } else {
        if (query.extract) {
          const importUrlPrefix = getImportPrefix(this, true)
          const importUrl = importUrlPrefix + addQuery(imp.url, { isStatic: true, issuerResource: this.resource })
          return 'exports.push([module.id, ' +
            JSON.stringify('@import "') +
            '+ require(' + loaderUtils.stringifyRequest(this, importUrl) + ') +' +
            JSON.stringify('";') + ', ' +
            JSON.stringify(imp.mediaQuery) + ']);'
        }
        const importUrl = importUrlPrefix + imp.url
        return 'exports.i(require(' + loaderUtils.stringifyRequest(this, importUrl) + '), ' + JSON.stringify(imp.mediaQuery) + ');'
      }
    }, this).join('\n')

    function importItemMatcher (item) {
      const match = result.importItemRegExp.exec(item)
      const idx = +match[1]
      const importItem = result.importItems[idx]
      const importUrl = importUrlPrefix + importItem.url
      return '" + require(' + loaderUtils.stringifyRequest(this, importUrl) + ').locals' +
        '[' + JSON.stringify(importItem.export) + '] + "'
    }

    cssAsString = cssAsString.replace(result.importItemRegExpG, importItemMatcher.bind(this))

    // helper for ensuring valid CSS strings from requires
    let urlEscapeHelper = ''

    if (query.url !== false && result.urlItems.length > 0) {
      urlEscapeHelper = 'var escape = require(' + loaderUtils.stringifyRequest(this, '!!' + require.resolve('./url/escape.js')) + ');\n'

      cssAsString = cssAsString.replace(result.urlItemRegExpG, function (item) {
        const match = result.urlItemRegExp.exec(item)
        let idx = +match[1]
        const urlItem = result.urlItems[idx]
        const url = resolve(urlItem.url)
        idx = url.indexOf('?#')
        if (idx < 0) idx = url.indexOf('#')
        var urlRequest
        if (idx > 0) { // idx === 0 is catched by isUrlRequest
          // in cases like url('webfont.eot?#iefix')
          urlRequest = url.substr(0, idx)
          return '" + escape(require(' + loaderUtils.stringifyRequest(this, urlRequest) + ')) + "' +
            url.substr(idx)
        }
        urlRequest = url
        return '" + escape(require(' + loaderUtils.stringifyRequest(this, urlRequest) + ')) + "'
      }.bind(this))
    }

    let exportJs = compileExports(result, importItemMatcher.bind(this), camelCaseKeys)
    if (exportJs) {
      exportJs = 'exports.locals = ' + exportJs + ';'
    }

    let moduleJs
    if (sourceMap && result.map) {
      // add a SourceMap
      map = result.map
      if (map.sources) {
        map.sources = map.sources.map(function (source) {
          return source.split('!').pop().replace(/\\/g, '/')
        }, this)
        map.sourceRoot = ''
      }
      map.file = map.file.split('!').pop().replace(/\\/g, '/')
      map = JSON.stringify(map)
      moduleJs = 'exports.push([module.id, ' + cssAsString + ', "", ' + map + ']);'
    } else {
      moduleJs = 'exports.push([module.id, ' + cssAsString + ', ""]);'
    }

    // embed runtime
    callback(null, urlEscapeHelper +
      'exports = module.exports = require(' +
      loaderUtils.stringifyRequest(this, '!!' + require.resolve('./css-base.js')) +
      ')(' + sourceMap + ');\n' +
      '// imports\n' +
      importJs + '\n\n' +
      '// module\n' +
      moduleJs + '\n\n' +
      '// exports\n' +
      exportJs)
  }.bind(this))
}
