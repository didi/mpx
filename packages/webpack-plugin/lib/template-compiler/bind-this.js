const babylon = require('babylon')
const traverse = require('babel-traverse').default
const t = require('babel-types')
const generate = require('babel-generator').default

let names = 'Infinity,undefined,NaN,isFinite,isNaN,' +
  'parseFloat,parseInt,decodeURI,decodeURIComponent,encodeURI,encodeURIComponent,' +
  'Math,Number,Date,Array,Object,Boolean,String,RegExp,Map,Set,JSON,Intl,' +
  'require,global,__seen,__renderData'

let hash = {}
names.split(',').forEach(function (name) {
  hash[name] = true
})

let dangerousKeys = 'length,size,prototype'
let dangerousKeyMap = {}
dangerousKeys.split(',').forEach((key) => {
  dangerousKeyMap[key] = true
})

module.exports = {
  transform (code, {
    needCollect = false,
    ignoreMap = {}
  } = {}) {
    const keyPathMap = {}
    const ast = babylon.parse(code, {
      plugins: [
        'objectRestSpread'
      ]
    })

    const propKeys = []
    let isProps = false

    let bindThisVisitor = {
      CallExpression: {
        enter (path) {
          const callee = path.node.callee
          const args = path.node.arguments
          if (
            t.isMemberExpression(callee) &&
            t.isThisExpression(callee.object) &&
            (callee.property.name === '__travel' || callee.property.value === '__travel') &&
            t.isBooleanLiteral(args[2]) &&
            args[2].value === true
          ) {
            isProps = true
            path.isProps = true
          }
        },
        exit (path) {
          if (path.isProps) {
            isProps = false
          }
        }
      },
      Identifier (path) {
        if (
          !(t.isDeclaration(path.parent) && path.parentKey === 'id') &&
          !(t.isFunction(path.parent) && path.listKey === 'params') &&
          !(t.isMethod(path.parent) && path.parentKey === 'key' && !path.parent.computed) &&
          !(t.isProperty(path.parent) && path.parentKey === 'key' && !path.parent.computed) &&
          !(t.isMemberExpression(path.parent) && path.parentKey === 'property' && !path.parent.computed) &&
          !t.isArrayPattern(path.parent) &&
          !t.isObjectPattern(path.parent) &&
          !hash[path.node.name]
        ) {
          let current
          let last
          if (!path.scope.hasBinding(path.node.name) && !ignoreMap[path.node.name]) {
            // bind this
            path.replaceWith(t.memberExpression(t.thisExpression(), path.node))

            if (isProps) {
              propKeys.push(path.node.property.name)
            }

            if (needCollect) {
              // 找到访问路径
              current = path.parentPath
              last = path
              let keyPath = '' + path.node.property.name
              while (current.isMemberExpression() && last.parentKey !== 'property') {
                if (current.node.computed) {
                  if (t.isLiteral(current.node.property)) {
                    if (t.isStringLiteral(current.node.property)) {
                      if (dangerousKeyMap[current.node.property.value]) {
                        break
                      }
                      keyPath += `.${current.node.property.value}`
                    } else {
                      keyPath += `[${current.node.property.value}]`
                    }
                  } else {
                    break
                  }
                } else {
                  if (dangerousKeyMap[current.node.property.name]) {
                    break
                  }
                  keyPath += `.${current.node.property.name}`
                }
                last = current
                current = current.parentPath
              }

              if (!keyPathMap[keyPath]) {
                keyPathMap[keyPath] = true
                // 构造赋值表达式左值节点并挂到要改的path下，右值因为可能存在后续变更，在对memberExpression访问exit时进行替换处理
                last.assignment = t.memberExpression(t.identifier('__renderData'), t.stringLiteral(keyPath), true)
              }
            }
          }
        }
      },
      MemberExpression: {
        exit (path) {
          if (path.assignment) {
            path.replaceWith(t.assignmentExpression('=', path.assignment, path.node))
          }
        }
      }
    }

    traverse(ast, bindThisVisitor)

    return {
      code: generate(ast).code,
      propKeys
    }
  }
}
