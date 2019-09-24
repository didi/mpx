const path = require('path')
const cache = require('lru-cache')(100)
const hash = require('hash-sum')
const compiler = require('./template-compiler/compiler')
const SourceMapGenerator = require('source-map').SourceMapGenerator

const splitRE = /\r?\n/g
const emptyRE = /^(?:\/\/)?\s*$/

module.exports = (content, filePath, needMap, mode) => {
  const filename = path.basename(filePath)
  const cacheKey = hash(filename + content + mode)
  let output = cache.get(cacheKey)
  if (output) return output
  output = compiler.parseComponent(content, {
    mode,
    filePath
  })
  if (needMap) {
    // source-map cache busting for hot-reloadded modules
    const filenameWithHash = filename + '?' + cacheKey
    if (output.script && !output.script.src) {
      output.script.map = generateSourceMap(
        filenameWithHash,
        content,
        output.script.content
      )
    }
    if (output.styles) {
      output.styles.forEach(style => {
        if (!style.src) {
          style.map = generateSourceMap(
            filenameWithHash,
            content,
            style.content
          )
        }
      })
    }
  }
  cache.set(cacheKey, output)
  return output
}

function generateSourceMap (filename, source, generated) {
  const map = new SourceMapGenerator()
  map.setSourceContent(filename, source)
  generated.split(splitRE).forEach((line, index) => {
    if (!emptyRE.test(line)) {
      map.addMapping({
        source: filename,
        original: {
          line: index + 1,
          column: 0
        },
        generated: {
          line: index + 1,
          column: 0
        }
      })
    }
  })
  return map.toJSON()
}
