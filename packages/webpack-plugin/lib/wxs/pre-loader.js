const babylon = require('@babel/parser')
const traverse = require('@babel/traverse').default
const t = require('@babel/types')
const generate = require('@babel/generator').default
const parseRequest = require('../utils/parse-request')
const isEmptyObject = require('../utils/is-empty-object')
const parseQuery = require('loader-utils').parseQuery

module.exports = function (content) {
  this.cacheable()
  const mpx = this.getMpx()
  const module = this._module
  const mode = mpx.mode
  const wxsModule = parseQuery(this.resourceQuery || '?').wxsModule

  // 处理内联wxs
  if (wxsModule) {
    const wxsContentMap = mpx.wxsContentMap
    const rawResourcePath = parseRequest(this.resource).rawResourcePath
    content = wxsContentMap[`${rawResourcePath}~${wxsModule}`] || content
  }

  const visitor = {}

  if (module.wxs) {
    if (mode === 'ali') {
      const insertNodes = babylon.parse(
        'var __mpx_args__ = [];\n' +
        'for (var i = 0; i < arguments.length; i++) {\n' +
        '  __mpx_args__[i] = arguments[i];\n' +
        '}'
      ).program.body
      // todo Object.assign可能会覆盖，未来存在非预期的覆盖case时需要改进处理
      Object.assign(visitor, {
        Identifier (path) {
          if (path.node.name === 'arguments') {
            path.node.name = '__mpx_args__'
            const targetPath = path.getFunctionParent().get('body')
            if (!targetPath.inserted) {
              const results = targetPath.unshiftContainer('body', insertNodes) || []
              targetPath.inserted = true
              results.forEach((item) => {
                item.shouldStopTraverse = true
              })
            }
          }
        },
        ForStatement (path) {
          if (path.shouldStopTraverse) {
            path.stop()
          }
        },
        // 处理vant-aliapp中export var bem = bem;这种不被acorn支持的2b语法
        ExportNamedDeclaration (path) {
          if (
            path.node.declaration &&
            path.node.declaration.declarations &&
            path.node.declaration.declarations.length === 1 &&
            path.node.declaration.declarations[0].id.name === path.node.declaration.declarations[0].init.name
          ) {
            const name = path.node.declaration.declarations[0].id.name
            path.replaceWith(t.exportNamedDeclaration(undefined, [t.exportSpecifier(t.identifier(name), t.identifier(name))]))
          }
        }
      })
    }

    if (mode !== 'wx') {
      Object.assign(visitor, {
        CallExpression (path) {
          const callee = path.node.callee
          if (t.isIdentifier(callee) && callee.name === 'getRegExp') {
            const argPath = path.get('arguments')[0]
            if (argPath.isStringLiteral()) {
              argPath.replaceWith(t.stringLiteral(argPath.node.extra.raw.slice(1, -1)))
            }
          }
        }
      })
    }
  }

  if (mode === 'dd') {
    Object.assign(visitor, {
      MemberExpression (path) {
        const property = path.node.property
        if (
          (property.name === 'constructor' || property.value === 'constructor') &&
          !(t.isMemberExpression(path.parent) && path.parentKey === 'object')
        ) {
          path.replaceWith(t.logicalExpression('||', t.memberExpression(path.node, t.identifier('name')), path.node))
          path.skip()
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
