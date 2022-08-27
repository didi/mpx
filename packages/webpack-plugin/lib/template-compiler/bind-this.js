const babylon = require('@babel/parser')
const traverse = require('@babel/traverse').default
const t = require('@babel/types')
const generate = require('@babel/generator').default

let names = 'Infinity,undefined,NaN,isFinite,isNaN,' +
  'parseFloat,parseInt,decodeURI,decodeURIComponent,encodeURI,encodeURIComponent,' +
  'Math,Number,Date,Array,Object,Boolean,String,RegExp,Map,Set,JSON,Intl,' +
  'require,global'

let hash = {}
names.split(',').forEach(function (name) {
  hash[name] = true
})

let dangerousKeys = 'length,size,prototype'
let dangerousKeyMap = {}
dangerousKeys.split(',').forEach((key) => {
  dangerousKeyMap[key] = true
})

function testInIf (node) {
  let current = node
  while (current.parentPath) {
    if (current.parentPath.type === 'IfStatement' &&
      current.key === 'test') {
      return true
    }
    current = current.parentPath
  }
  return false
}

function getMemberExp (node) {
  if (!t.isMemberExpression(node)) return ''
  let current = node
  let keyPath = current.property.name
  while (t.isMemberExpression(current.object)) {
    keyPath = node.object.property.name + `.${keyPath}`
    current = current.object
  }
  if (t.isIdentifier(current.object)) {
    keyPath = current.object.name + `.${keyPath}`
  }
  return keyPath
}

module.exports = {
  transform (code, {
    needCollect = false,
    ignoreMap = {}
  } = {}) {
    const ast = babylon.parse(code, {
      plugins: [
        'objectRestSpread'
      ]
    })

    const propKeys = []
    let isProps = false
    const collectedConst = {}

    let bindThisVisitor = {
      // 标记收集props数据
      CallExpression: {
        enter (path) {
          const callee = path.node.callee
          if (
            t.isMemberExpression(callee) &&
            t.isThisExpression(callee.object) &&
            (callee.property.name === '_p' || callee.property.value === '_p')
          ) {
            const arg = path.node.arguments[0]
            const keyPath = getMemberExp(arg)
            if (
              collectedConst[keyPath] ||
              (arg.type === 'Identifier' && collectedConst[arg.name])
            ) {
              path.remove()
            } else {
              isProps = true
              path.isProps = true
            }
          }
        },
        exit (path) {
          if (path.isProps) {
            // 移除无意义的__props调用
            path.replaceWith(path.node.arguments[0])
            isProps = false
            delete path.isProps
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
              let hasComputed = false
              while (current.isMemberExpression() && last.parentKey !== 'property') {
                if (current.node.computed) {
                  hasComputed = true
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
              last.collectPath = t.stringLiteral(keyPath)
              if (collectedConst[keyPath]) {
                if (
                  (
                    t.isExpressionStatement(last.parent) ||
                    (t.isMemberExpression(last.parent) && t.isExpressionStatement(last.parentPath.parent) && // a['b']
                    !t.isThisExpression(last.node.object) && // a[b]
                    !hasComputed) // a.b[c]
                  ) &&
                  !testInIf(last)
                ) {
                  last.remove()
                } else if (t.isObjectProperty(last.parent)) { // { name: a.b }
                  last.parentPath.remove()
                } else {
                  collectedConst[keyPath] = path
                }
              } else {
                collectedConst[keyPath] = path
              }
            }
          }
        }
      },
      StringLiteral (path) {
        if (
          path.key === 'consequent' ||
          path.key === 'alternate' ||
          (
            t.isBinaryExpression(path.parent) &&
            (t.isExpressionStatement(path.parentPath.parent) || t.isBinaryExpression(path.parentPath.parent))
          )
        ) {
          if (!testInIf(path)) {
            path.node.value = ''
          }
        } else if (
          (
            t.isExpressionStatement(path.parent) || // ('str');
            (path.listKey === 'elements' && path.parent.type === 'ArrayExpression') // ['abc']
          ) &&
          !testInIf(path)
        ) {
          path.remove()
        }
      },
      'BooleanLiteral|NumericLiteral' (path) {
        if (
          (
            t.isExpressionStatement(path.parentPath) || // 纯Boolean或数字值
            (path.listKey === 'elements' && path.parent.type === 'ArrayExpression') // [true, 123]
          ) &&
          !testInIf(path)
        ) {
          path.remove()
        }
      },
      ObjectProperty (path) {
        const canDelType = ['StringLiteral', 'NumericLiteral', 'BooleanLiteral']
        const value = path.node.value
        if (
          canDelType.includes(value.type) ||
          (
            t.isIdentifier(value) &&
            collectedConst[value.name]
          )
        ) {
          path.remove()
        }
      },
      MemberExpression: {
        exit (path) {
          if (path.collectPath) {
            path.replaceWith(t.callExpression(t.memberExpression(t.thisExpression(), t.identifier('_c')), [path.collectPath, path.node]))
            delete path.collectPath
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
