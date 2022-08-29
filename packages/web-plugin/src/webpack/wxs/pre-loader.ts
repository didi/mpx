const babylon = require('@babel/parser')
const traverse = require('@babel/traverse').default
const t = require('@babel/types')
const generate = require('@babel/generator').default
const parseRequest = require('@mpxjs/utils/parse-request')
const isEmptyObject = require('@mpxjs/utils/is-empty-object')
const parseQuery = require('loader-utils').parseQuery
const mpx = require('../mpx')

module.exports = function (content) {
  this.cacheable()
  const module = this._module
  const wxsModule = parseQuery(this.resourceQuery || '?').wxsModule

  // 处理内联wxs
  if (wxsModule) {
    const wxsContentMap = mpx.wxsContentMap
    const resourcePath = parseRequest(this.resource).resourcePath
    content = wxsContentMap[`${resourcePath}~${wxsModule}`] || content
  }

  const visitor = {}
  if (!module.wxs) {
    Object.assign(visitor, {
      MemberExpression (path) {
        const property = path.node.property
        if (
          (property.name === 'constructor' || property.value === 'constructor') &&
          !(t.isMemberExpression(path.parent) && path.parentKey === 'object')
        ) {
          path.replaceWith(t.memberExpression(path.node, t.identifier('name')))
          path.skip()
        }
      },
      CallExpression (path) {
        const callee = path.node.callee
        const args = path.node.arguments
        const transMap = {
          getDate: 'Date',
          getRegExp: 'RegExp'
        }
        if (t.isIdentifier(callee) && transMap[callee.name]) {
          if (callee.name === 'getRegExp') {
            const arg = args[0]
            if (t.isStringLiteral(arg)) {
              args[0] = t.stringLiteral(arg.extra.raw.slice(1, -1))
            }
          }
          path.replaceWith(t.newExpression(t.identifier(transMap[callee.name]), args))
        }
      }
    })
  }

  if (!isEmptyObject(visitor)) {
    const ast = babylon.parse(content, {
      sourceType: 'module'
    })
    traverse(ast, visitor)
    return generate(ast).code
  } else {
    return content
  }
}
