const babylon = require('babylon')
const traverse = require('babel-traverse').default
const t = require('babel-types')
const generate = require('babel-generator').default
const isValidIdentifierStr = require('../utils/is-valid-identifier-str')

let names = 'Infinity,undefined,NaN,isFinite,isNaN,' +
  'parseFloat,parseInt,decodeURI,decodeURIComponent,encodeURI,encodeURIComponent,' +
  'Math,Number,Date,Array,Object,Boolean,String,RegExp,Map,Set,JSON,Intl,' +
  'require,global,__seen'

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

    let hasIgnore = false

    let bindThisVisitor = {
      CallExpression: {
        enter (path) {
          let callee = path.node.callee
          if (t.isMemberExpression(callee) && t.isThisExpression(callee.object) && callee.property.name === '__checkIgnore') {
            hasIgnore = false
          }
        },
        exit (path) {
          let callee = path.node.callee
          if (t.isMemberExpression(callee) && t.isThisExpression(callee.object) && callee.property.name === '__checkIgnore') {
            path.pushContainer('arguments', t.booleanLiteral(hasIgnore))
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
          !path.scope.hasBinding(path.node.name) &&
          !hash[path.node.name]
        ) {
          let current
          let last
          if (ignoreMap[path.node.name]) {
            hasIgnore = true
            last = path
            current = path.parentPath
            let exps = []
            while (current.isMemberExpression() && last.parentKey !== 'property') {
              if (current.node.computed) {
                exps.push(current.node.property)
              }
              last.stop()
              last = current
              current = current.parentPath
            }
            // m1 in ignoreMap
            // someData[m1.someKey] => this.__travel(this.someData, __seen)["__wxs__"];
            if (current.isMemberExpression() && last.parentKey === 'property') {
              let objectPath = current.get('object')
              let targetNode = t.callExpression(t.memberExpression(t.thisExpression(), t.identifier('__travel')), [objectPath.node, t.identifier('__seen')])
              objectPath.replaceWith(targetNode)
            }
            if (current.isCallExpression() && last.parentKey === 'callee') {
              exps.push(t.functionExpression(null, [], t.blockStatement([])))
            } else if (current.isSpreadProperty()) {
              exps.push(t.objectExpression([]))
            } else if (current.isSpreadElement()) {
              exps.push(t.arrayExpression([]))
            } else {
              if (!exps.length) {
                exps.push(t.stringLiteral('__wxs__'))
              }
            }
            last.replaceWith(exps.length > 1 ? t.sequenceExpression(exps) : exps[0])
            return
          }

          if (needCollect) {
            // 找到访问路径
            current = path.parentPath
            last = path
            let keyPath = path.node.name
            while (current.isMemberExpression() && last.parentKey !== 'property') {
              if (current.node.computed) {
                if (t.isLiteral(current.node.property)) {
                  if (t.isStringLiteral(current.node.property)) {
                    if (!isValidIdentifierStr(current.node.property.value) || dangerousKeyMap[current.node.property.value]) {
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

            // 构造赋值语句把访问的路径和值收集进renderData
            const assignment = t.assignmentExpression('=', t.memberExpression(t.identifier('renderData'), t.stringLiteral(keyPath), true), t.memberExpression(t.thisExpression(), t.identifier(keyPath)))
            // 向上找到方法调用
            const parentPath = path.findParent((path) => path.isCallExpression())
            // 取到方法调用的参数
            const parentPathArgumentArr = parentPath.node.arguments
            // 修改第一个参数
            parentPathArgumentArr[0] = t.sequenceExpression([assignment, parentPathArgumentArr[0]])
          }

          // bind this
          path.replaceWith(t.memberExpression(t.thisExpression(), path.node))

          // flag get
          last = path
          current = path.parentPath
          while (current.isMemberExpression() && last.parentKey !== 'property') {
            current.shouldGet = true
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
        }
      }
    }

    traverse(ast, bindThisVisitor)

    return {
      code: generate(ast).code
    }
  }
}
