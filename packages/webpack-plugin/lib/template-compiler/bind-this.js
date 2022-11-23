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

function dealRemove (path, isProps) {
  if (isProps && path.listKey === 'arguments') {
    path.parentPath.remove()
  } else if (t.isObjectProperty(path.parentPath)) {
    path.parentPath.remove()
  } else {
    path.remove()
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
            path.replaceWith(path.node.arguments[0])
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
              last.collectPath = t.stringLiteral(keyPath)

              const { currentBindings } = scopeBlock.get(currentBlock)
              const hasComputed = last.parentPath.node && last.parentPath.node.computed // a.b[c]
              const canDel = !inIfTest && !hasComputed && !inConditional // && last.listKey !== 'arguments'

              if (currentBindings[keyPath]) {
                if (canDel) {
                  dealRemove(last, isProps)
                } else {
                  // 当前变量不能被删除则删除前一个变量 & 更新节点为当前节点
                  const { canDel: preCanDel, path: prePath, isProps: preIsProps } = currentBindings[keyPath]
                  if (preCanDel) {
                    dealRemove(prePath, preIsProps)
                  }
                  currentBindings[keyPath] = {
                    path: last,
                    canDel,
                    isProps: preIsProps
                  }
                }
              } else {
                currentBindings[keyPath] = {
                  path: last,
                  canDel,
                  isProps
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
