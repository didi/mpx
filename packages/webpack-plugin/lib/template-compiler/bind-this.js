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
              let rightExpression = t.memberExpression(t.thisExpression(), t.identifier(keyPath))
              while (current.isMemberExpression() && last.parentKey !== 'property') {
                if (current.node.computed) {
                  if (t.isLiteral(current.node.property)) {
                    if (t.isStringLiteral(current.node.property)) {
                      if (dangerousKeyMap[current.node.property.value]) {
                        break
                      }
                      keyPath += `.${current.node.property.value}`
                      rightExpression = t.memberExpression(rightExpression, t.stringLiteral(current.node.property.value), true)
                    } else {
                      keyPath += `[${current.node.property.value}]`
                      rightExpression = t.memberExpression(rightExpression, t.numericLiteral(current.node.property.value), true)
                    }
                  } else {
                    break
                  }
                } else {
                  if (dangerousKeyMap[current.node.property.name]) {
                    break
                  }
                  keyPath += `.${current.node.property.name}`
                  rightExpression = t.memberExpression(rightExpression, t.identifier(current.node.property.name))
                }
                last = current
                current = current.parentPath
              }
              // 构造赋值语句并挂到要改的path下，等对memberExpression访问exit时处理
              last.assignment = t.assignmentExpression('=', t.memberExpression(t.identifier('__renderData'), t.stringLiteral(keyPath), true), rightExpression)
            }
          }
          // flag get
          last = path
          current = path.parentPath
          while (current.isMemberExpression() && last.parentKey !== 'property') {
            if (!dangerousKeyMap[current.node.property.name || current.node.property.value]) {
              current.shouldGet = true
            }
            last = current
            current = current.parentPath
          }
        }
      },
      MemberExpression: {
        exit (path) {
          if (path.shouldGet) {
            delete path.shouldGet
            let property
            if (path.node.computed) {
              property = path.node.property
            } else {
              property = t.stringLiteral(path.node.property.name)
            }
            let targetNode = t.callExpression(t.memberExpression(t.thisExpression(), t.identifier('__get')), [path.node.object, property])
            path.replaceWith(targetNode)
          }
          if (path.assignment) {
            path.replaceWith(t.sequenceExpression([path.assignment, path.node]))
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
