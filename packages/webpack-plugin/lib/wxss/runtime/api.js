/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
/* eslint no-var: off */
module.exports = function (cssWithMappingToString) {
  var list = []

  // return the list of modules as css string
  list.toString = function toString () {
    return this.map(function (item) {
      var content = ''

      var needLayer = typeof item[5] !== 'undefined'

      if (item[4]) {
        content += '@supports (' + item[4] + ') {'
      }

      if (item[2]) {
        content += '@media ' + item[2] + '{'
      }

      if (needLayer) {
        content += '@layer' + (item[5].length > 0 ? item[5] : '') + '{'
      }

      content += cssWithMappingToString(item)

      if (needLayer) {
        content += '}'
      }

      if (item[2]) {
        content += '}'
      }

      if (item[4]) {
        content += '}'
      }

      return content
    }).join('')
  }

  // import a list of modules into the list
  list.i = function i (modules, media, dedupe, supports, layer) {
    if (typeof modules === 'string') {
      modules = [[null, modules, undefined]]
    }

    var alreadyImportedModules = {}

    if (dedupe) {
      for (var k = 0; k < this.length; k++) {
        var id = this[k][0]

        if (id != null) {
          alreadyImportedModules[id] = true
        }
      }
    }

    for (var k1 = 0; k1 < modules.length; k1++) {
      var item = [].concat(modules[k1])

      if (dedupe && alreadyImportedModules[item[0]]) {
        continue
      }

      if (typeof layer !== 'undefined') {
        if (typeof item[5] === 'undefined') {
          item[5] = layer
        } else {
          item[1] = '@layer' + (item[5].length > 0 ? item[5] : '') + '{' + item[1] + '}'
          item[5] = layer
        }
      }

      if (media) {
        if (!item[2]) {
          item[2] = media
        } else {
          item[1] = '@media' + item[2] + item[1]
          item[2] = media
        }
      }

      if (supports) {
        if (!item[4]) {
          item[4] = String(supports)
        } else {
          item[1] = '@supports (' + item[4] + ')' + '{' + item[1] + '}'
          item[4] = supports
        }
      }

      list.push(item)
    }
  }

  return list
}
