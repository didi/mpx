const babylon = require('@babel/parser')
const traverse = require('@babel/traverse').default
const t = require('@babel/types')
const generate = require('@babel/generator').default

const names = 'Infinity,undefined,NaN,isFinite,isNaN,' +
  'parseFloat,parseInt,decodeURI,decodeURIComponent,encodeURI,encodeURIComponent,' +
  'Math,Number,Date,Array,Object,Boolean,String,RegExp,Map,Set,JSON,Intl,' +
  'require,global'

const hash = {}
names.split(',').forEach(function (name) {
  hash[name] = true
})

const dangerousKeys = 'length,size,prototype'
const dangerousKeyMap = {}
dangerousKeys.split(',').forEach((key) => {
  dangerousKeyMap[key] = true
})

function dealRemove (path, replace) {
  try {
    if (replace) {
      path.replaceWith(t.stringLiteral(''))
    } else {
      path.remove()
    }
  } catch (e) {
    console.log(e)
  }
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
    let inIfTest = false // if条件判断
    let inConditional = false
    // block 作用域
    const scopeBlock = new Map()
    let currentBlock = null

    const bindThisVisitor = {
      // 标记收集props数据
      CallExpression: {
        enter (path) {
          const callee = path.node.callee
          if (
            t.isMemberExpression(callee) &&
            t.isThisExpression(callee.object) &&
            (callee.property.name === '_p' || callee.property.value === '_p')
          ) {
            isProps = true
            path.isProps = true
          }
        },
        exit (path) {
          if (path.isProps) {
            // 移除无意义的__props调用
            const arg = path.node.arguments[0] // this._p里的参数可能被删除，比如 this._p($t('xxx'))
            if (arg) {
              path.replaceWith(arg)
            }
            // TODO this._p() 待删除
            isProps = false
            delete path.isProps
          }
        }
      },
      BlockStatement: {
        enter (path) {
          inIfTest && (inIfTest = false) // [if (name) name2] 场景会有异常，name2会被判定在if条件判断里面
          const currentBindings = {}
          if (currentBlock) {
            const { currentBindings: pBindings } = scopeBlock.get(currentBlock)
            Object.assign(currentBindings, pBindings)
          }
          scopeBlock.set(path, {
            parent: currentBlock,
            currentBindings
          })
          currentBlock = path
        },
        exit (path) {
          const { parent } = scopeBlock.get(path)
          currentBlock = parent
        }
      },
      ConditionalExpression: {
        enter () {
          inConditional = true
        },
        exit () {
          inConditional = false
        }
      },
      IfStatement: {
        enter () {
          inIfTest = true
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
              let replace = false
              let hasDangerous = false
              while (current.isMemberExpression() && last.parentKey !== 'property') {
                if (current.node.computed) {
                  if (t.isLiteral(current.node.property)) {
                    if (t.isStringLiteral(current.node.property)) {
                      if (dangerousKeyMap[current.node.property.value]) {
                        hasDangerous = true
                        break
                      }
                      keyPath += `.${current.node.property.value}`
                    } else {
                      keyPath += `[${current.node.property.value}]`
                    }
                  } else {
                    hasComputed = true
                    break
                  }
                } else {
                  if (dangerousKeyMap[current.node.property.name]) {
                    hasDangerous = true
                    break
                  }
                  keyPath += `.${current.node.property.name}`
                }
                last = current
                current = current.parentPath
              }
              last.collectPath = t.stringLiteral(keyPath)

              const { currentBindings } = scopeBlock.get(currentBlock)
              let canDel = !inIfTest && !hasComputed
                && last.key !== 'property' && last.parentPath.key !== 'property'
              if (last.key === 'callee') {
                if (last.node.property.name === '$t') {
                  dealRemove(last.parentPath)
                  return
                } else {
                  canDel && (canDel = false)
                }
              }
              if (canDel) {
                // 'object' 的判断，要在 'argument' 之前 !a.length
                if (last.key === 'object' && hasDangerous) { // a.length
                  last = last.parentPath
                }
                if (last.key === 'argument') {
                  last = last.parentPath
                  while (t.isUnaryExpression(last) && last.key === 'argument') { // !!a
                    last = last.parentPath
                  }
                }
                if (last.listKey === 'arguments' && last.key === 0 &&
                  t.isCallExpression(last.parent)
                ) {
                  const name = last.parent.callee.property.name
                  if (name === '_i') {
                    canDel = false
                  } else if (name === '_p') {
                    last = last.parentPath
                  }
                }
                if (inConditional) {
                  let current = last
                  let inTest = false
                  while (current) {
                    if (current.key === 'test') {
                      inTest = true
                      break
                    }
                    current = current.parentPath
                  }
                  if (inTest) {
                    canDel = false
                  } else {
                    replace = true
                  }
                }
                if (t.isBinaryExpression(last.container)) { // a + b
                  replace = true
                }
                if (t.isLogicalExpression(last.container)) { // a && b
                  replace = true
                }
                if (last.key === 'value' && t.isObjectProperty(last.container)) {
                  replace = true
                }
              }

              if (currentBindings[keyPath]) {
                if (canDel) {
                  dealRemove(last, replace)
                } else {
                  // 当前变量不能被删除则删除前一个变量 & 更新节点为当前节点
                  const { canDel: preCanDel, path: prePath, replace: preReplace, current: preCurrent } = currentBindings[keyPath]
                  if (preCanDel && preCurrent === currentBlock) {
                    dealRemove(prePath, preReplace)
                    // currentBindings[keyPath] = null // 删除 前一个节点，则
                  }
                  currentBindings[keyPath] = {
                    path: last,
                    canDel,
                    replace,
                    current: currentBlock
                  }
                }
              } else {
                currentBindings[keyPath] = {
                  path: last,
                  canDel,
                  replace,
                  current: currentBlock
                }
              }
            }
          }
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
