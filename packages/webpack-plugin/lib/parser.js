const cache = require('lru-cache')(100)
const hash = require('hash-sum')
const compiler = require('./template-compiler/compiler')
const SourceMapGenerator = require('source-map').SourceMapGenerator
const splitRE = /\r?\n/g
const emptyRE = /^(?:\/\/)?\s*$/

module.exports = (content, { filePath, needMap, mode, env }) => {
  // 缓存需要mode隔离，不同mode经过区块条件编译parseComponent得到的内容并不一致
  const cacheKey = hash(filePath + content + mode + env)

  let output = cache.get(cacheKey)
  if (output) return JSON.parse(output)
  output = compiler.parseComponent(content, {
    mode,
    filePath,
    pad: 'line',
    env
  })
  if (needMap) {
    // 添加hash避免content被webpack的sourcemap覆盖
    const filename = filePath + '?' + cacheKey
    // source-map cache busting for hot-reloadded modules
    if (output.script && !output.script.src) {
      output.script.map = generateSourceMap(
        filename,
        content,
        output.script.content
      )
    }
    if (output.styles) {
      output.styles.forEach(style => {
        if (!style.src) {
          style.map = generateSourceMap(
            filename,
            content,
            style.content
          )
        }
      })
    }
  }
  // 使用JSON.stringify进行序列化缓存，避免修改输出对象时影响到缓存
  cache.set(cacheKey, JSON.stringify(output))
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
