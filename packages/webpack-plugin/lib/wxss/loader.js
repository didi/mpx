/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
  Modified by @hiyuki
*/
const loaderUtils = require('loader-utils')
const processCss = require('./processCss')
const compileExports = require('./compile-exports')
const createResolver = require('./createResolver')
const isUrlRequest = require('../utils/is-url-request')
const createHelpers = require('../helpers')

module.exports = function (content, map) {
  if (this.cacheable) this.cacheable()
  const callback = this.async()
  const query = loaderUtils.getOptions(this) || {}
  const moduleMode = query.modules || query.module
  const camelCaseKeys = query.camelCase || query.camelcase
  const resolve = createResolver(query.alias)
  const mpx = this.getMpx()
  const externals = mpx.externals
  const root = mpx.projectRoot
  const sourceMap = mpx.cssSourceMap || false

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

  const { getRequestString } = createHelpers(this)

  processCss(content, map, {
    mode: moduleMode ? 'local' : 'global',
    from: loaderUtils.getRemainingRequest(this).split('!').pop(),
    to: loaderUtils.getCurrentRequest(this).split('!').pop(),
    query,
    resolve,
    minimize: this.minimize,
    loaderContext: this,
    sourceMap
  }, (err, result) => {
    if (err) return callback(err)

    let cssAsString = JSON.stringify(result.source)

    const alreadyImported = {}
    const importJs = result.importItems.filter((imp) => {
      if (!imp.mediaQuery) {
        if (alreadyImported[imp.url]) {
          return false
        }
        alreadyImported[imp.url] = true
      }
      return true
    }).map((imp, i) => {
      if (!isUrlRequest(imp.url, root, externals)) {
        return 'exports.push([module.id, ' +
          JSON.stringify('@import url(' + imp.url + ');') + ', ' +
          JSON.stringify(imp.mediaQuery) + ']);'
      } else {
        const requestString = getRequestString('styles', { src: imp.url }, {
          isStatic: true,
          issuerFile: this.resource,
          fromImport: true
        }, i)
        return 'exports.push([module.id, ' +
          JSON.stringify('@import "') +
          '+ require(' + requestString + ') +' +
          JSON.stringify('";') + ', ' +
          JSON.stringify(imp.mediaQuery) + ']);'
      }
    }).join('\n')

    const importItemMatcher = (item) => {
      const match = result.importItemRegExp.exec(item)
      const idx = +match[1]
      const importItem = result.importItems[idx]
      const importUrl = importItem.url
      return '" + require(' + loaderUtils.stringifyRequest(this, importUrl) + ').locals' +
        '[' + JSON.stringify(importItem.export) + '] + "'
    }

    cssAsString = cssAsString.replace(result.importItemRegExpG, importItemMatcher)

    // helper for ensuring valid CSS strings from requires
    let urlEscapeHelper = ''

    if (query.url !== false && result.urlItems.length > 0) {
      urlEscapeHelper = 'var escape = require(' + loaderUtils.stringifyRequest(this, '!!' + require.resolve('./url/escape.js')) + ');\n'

      cssAsString = cssAsString.replace(result.urlItemRegExpG, (item) => {
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
      })
    }

    let exportJs = compileExports(result, importItemMatcher, camelCaseKeys)
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
  })
}
