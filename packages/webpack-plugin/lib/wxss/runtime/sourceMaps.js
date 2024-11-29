/* eslint no-var: off */
module.exports = function (item) {
  var content = item[1]
  var cssMapping = item[3]

  if (!cssMapping) {
    return content
  }

  if (typeof btoa === 'function') {
    // eslint-disable-next-line no-undef
    var base64 = btoa(
      unescape(encodeURIComponent(JSON.stringify(cssMapping)))
    )
    var data = `sourceMappingURL=data:application/json;charset=utf-8;base64,${base64}`
    var sourceMapping = `/*# ${data} */`

    var sourceURLs = cssMapping.sources.map(
      (source) => `/*# sourceURL=${cssMapping.sourceRoot || ''}${source} */`
    )

    return [content].concat(sourceURLs).concat([sourceMapping]).join('\n')
  }

  return [content].join('\n')
}
