const babylon = require('babylon')
const traverse = require('babel-traverse').default
const t = require('babel-types')
const generate = require('babel-generator').default
const getMainCompilation = require('../utils/get-main-compilation')
const stripExtension = require('../utils/strip-extention')
const parseQuery = require('loader-utils').parseQuery

module.exports = function (content) {
  this.cacheable()
  const mainCompilation = getMainCompilation(this._compilation)
  const selfCompilation = this._compilation
  const module = this._module
  const mode = mainCompilation.__mpx__.mode
  const wxsModule = parseQuery(this.resourceQuery || '?').wxsModule

  // 处理内联wxs
  if (wxsModule) {
    const wxsContentMap = mainCompilation.__mpx__.wxsConentMap
    const resource = stripExtension(this.resource)
    content = wxsContentMap[`${resource}~${wxsModule}`] || content
  }

  if (module.wxs && mode !== 'swan') {
    if (mode === 'ali') {
      let insertNodes = babylon.parse(
        'var __mpx_args__ = [];\n' +
        'for (var i = 0; i < arguments.length; i++) {\n' +
        '  __mpx_args__[i] = arguments[i];\n' +
        '}'
      ).program.body

      let argumentsVisitor = {
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
        }
      }
      const ast = babylon.parse(content, {
        sourceType: 'module'
      })
      traverse(ast, argumentsVisitor)
      return generate(ast).code
    } else {
      return content
    }
  } else {
    // 对于编译进render函数中和swan中的wxs模块进行处理，抹平差异

    let wxsVisitor = {
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
    }

    if (mode === 'swan' && module.wxs && selfCompilation.entries.indexOf(module) > -1) {
      if (!selfCompilation.__swan_exports_map__) {
        selfCompilation.__swan_exports_map__ = {}
      }
      Object.assign(wxsVisitor, {
        AssignmentExpression (path) {
          const left = path.node.left
          const right = path.node.right
          if (t.isMemberExpression(left) && left.object.name === 'module' && left.property.name === 'exports') {
            if (t.isObjectExpression(right)) {
              right.properties.forEach((property) => {
                selfCompilation.__swan_exports_map__[property.key.name] = true
              })
            } else {
              throw new Error('Swan filter module exports declaration must be an ObjectExpression!')
            }
          }
        },
        ExportDefaultDeclaration (path) {
          const declaration = path.node.declaration
          if (t.isObjectExpression(declaration)) {
            declaration.properties.forEach((property) => {
              selfCompilation.__swan_exports_map__[property.key.name] = true
            })
          } else {
            throw new Error('Swan filter module exports declaration must be an ObjectExpression!')
          }
        }
      })
    }
    const ast = babylon.parse(content, {
      sourceType: 'module'
    })
    traverse(ast, wxsVisitor)
    return generate(ast).code
  }
}
