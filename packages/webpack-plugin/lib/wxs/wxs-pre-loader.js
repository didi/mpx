const babylon = require('babylon')
const traverse = require('babel-traverse').default
const t = require('babel-types')
const generate = require('babel-generator').default
const getMainCompilation = require('../utils/get-main-compilation')
const parseRequest = require('../utils/parse-request')
const isEmptyObject = require('../utils/is-empty-object')
const parseQuery = require('loader-utils').parseQuery

module.exports = function (content) {
  this.cacheable()
  const mainCompilation = getMainCompilation(this._compilation)
  const module = this._module
  const mode = mainCompilation.__mpx__.mode
  const wxsModule = parseQuery(this.resourceQuery || '?').wxsModule

  // 处理内联wxs
  if (wxsModule) {
    const wxsContentMap = mainCompilation.__mpx__.wxsContentMap
    const resourcePath = parseRequest(this.resource).resourcePath
    content = wxsContentMap[`${resourcePath}~${wxsModule}`] || content
  }

  const visitor = {}

  if (module.wxs && mode === 'ali') {
    let insertNodes = babylon.parse(
      'var __mpx_args__ = [];\n' +
      'for (var i = 0; i < arguments.length; i++) {\n' +
      '  __mpx_args__[i] = arguments[i];\n' +
      '}'
    ).program.body
    // todo Object.assign可能会覆盖，未来存在覆盖case时需要改进处理
    Object.assign(visitor, {
      Identifier (path) {
        if (path.node.name === 'arguments') {
          path.node.name = '__mpx_args__'
          const targetPath = path.getFunctionParent().get('body')
          if (!targetPath.inserted) {
            let results = targetPath.unshiftContainer('body', insertNodes) || []
            targetPath.inserted = true
            results.forEach((item) => {
              item.stop()
            })
          }
        }
      },
      // 处理vant-aliapp中export var bem = bem;这种不被acorn支持的2b语法
      ExportNamedDeclaration (path) {
        if (
          path.node.declaration &&
          path.node.declaration.declarations.length === 1 &&
          path.node.declaration.declarations[0].id.name === path.node.declaration.declarations[0].init.name
        ) {
          const name = path.node.declaration.declarations[0].id.name
          path.replaceWith(t.exportNamedDeclaration(undefined, [t.exportSpecifier(t.identifier(name), t.identifier(name))]))
        }
      }
    })
  }

  if (!module.wxs) {
    Object.assign(visitor, {
      MemberExpression (path) {
        const property = path.node.property
        if (
          (property.name === 'constructor' || property.value === 'constructor') &&
          !(t.isMemberExpression(path.parent) && path.parentKey === 'object')
        ) {
          path.replaceWith(t.memberExpression(path.node, t.identifier('name')))
        }
      },
      CallExpression (path) {
        const callee = path.node.callee
        const transMap = {
          getDate: 'Date',
          getRegExp: 'RegExp'
        }
        if (t.isIdentifier(callee) && transMap[callee.name]) {
          path.replaceWith(t.newExpression(t.identifier(transMap[callee.name]), path.node.arguments))
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
