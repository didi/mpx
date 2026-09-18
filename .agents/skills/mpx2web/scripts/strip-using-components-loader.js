'use strict'

const { blocks, dependency } = require('./source-parser')

function removeUsingComponents (source, file = 'input.mpx') {
  const parsed = blocks(source, file)
  const parser = dependency('@babel/parser', file)
  const edits = []
  for (const block of parsed.blocks) {
    if (block.type !== 'script') continue
    const attrs = block.attrs
    const dynamic = attrs.name === 'json'
    const json = dynamic || attrs.type === 'application/json'
    if (!json) continue
    if (attrs.src || dynamic) {
      throw new Error('待验证：旧版局部编译不能可靠剥离动态或外联 JSON，请使用完整项目构建')
    }
    const ast = parser.parseExpression(block.content)
    if (ast.type !== 'ObjectExpression') throw new Error('待验证：JSON 配置不是静态对象')
    for (const prop of ast.properties) {
      if (prop.type !== 'ObjectProperty' || prop.computed) {
        throw new Error('待验证：JSON 配置含非静态属性')
      }
      if ((prop.key.name || prop.key.value) !== 'usingComponents') continue
      if (prop.value.type !== 'ObjectExpression') throw new Error('待验证：usingComponents 不是静态对象')
      edits.push({ start: block.start + prop.value.start, end: block.start + prop.value.end })
    }
  }
  for (const edit of edits.sort((a, b) => b.start - a.start)) {
    source = source.slice(0, edit.start) + '{}' + source.slice(edit.end)
  }
  return source
}

module.exports = function stripUsingComponentsLoader (source) {
  const callback = this.async()
  try {
    callback(null, removeUsingComponents(source, this.resourcePath))
  } catch (error) {
    callback(error)
  }
}
module.exports.removeUsingComponents = removeUsingComponents
