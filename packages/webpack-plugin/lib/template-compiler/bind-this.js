const babylon = require('babylon')
const traverse = require('babel-traverse').default
const t = require('babel-types')
const generate = require('babel-generator').default

let names = 'Infinity,undefined,NaN,isFinite,isNaN,' +
  'parseFloat,parseInt,decodeURI,decodeURIComponent,encodeURI,encodeURIComponent,' +
  'Math,Number,Date,Array,Object,Boolean,String,RegExp,Map,Set,JSON,Intl,' +
  'require,global'

let hash = {}
names.split(',').forEach(function (name) {
  hash[name] = true
})

function isValidIdentifierStr (str) {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(str)
}

let dangerousKeys = 'length,size,prototype'
let dangerousKeyMap = {}
dangerousKeys.split(',').forEach((key) => {
  dangerousKeyMap[key] = true
})

function processkeyPathMap (keyPathMap) {
  let keyPath = Object.keys(keyPathMap)
  return keyPath.filter((keyA) => {
    return keyPath.every((keyB) => {
      if (keyA.startsWith(keyB) && keyA !== keyB) {
        let nextChar = keyA[keyB.length]
        if (nextChar === '.' || nextChar === '[') {
          return false
        }
      }
      return true
    })
  })
}

module.exports = {
  transform (code, ignoreMap = {}, needKeyPathArr = false) {
    const ast = babylon.parse(code, {
      plugins: [
        'objectRestSpread'
      ]
    })

    let keyPathMap = {}
    let bindThisVisitor = {
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
          if (ignoreMap[path.node.name]) {
            let current = path.parentPath
            let last = path
            while (current.isMemberExpression() && last.parentKey !== 'property') {
              last = current
              current = current.parentPath
            }
            last.replaceWith(t.stringLiteral('__wxs_placeholer'))
          }
          if (needKeyPathArr) {
            let keyPath = path.node.name
            let current = path.parentPath
            let last = path
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
            keyPathMap[keyPath] = true
          }
          let targetNode = t.memberExpression(t.thisExpression(), path.node)
          path.replaceWith(targetNode)
        }
      }
    }

    traverse(ast, bindThisVisitor)

    return {
      code: generate(ast).code,
      keyPathArr: processkeyPathMap(keyPathMap)
    }
  }
}
