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
  if (replace) {
    path.replaceWith(t.stringLiteral(''))
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
            const arg = path.node.arguments[0] // this._p里的参数可能被删除，比如 this._p($t('xxx'))
            if (arg) {
              path.replaceWith(arg)
            }
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

              let canDel = !inIfTest && !hasComputed && last.key !== 'property' && last.parentPath.key !== 'property'
              if (last.key === 'callee') {
                if (last.node.property.name === '$t') { // i18n直接删除
                  if (t.isCallExpression(last.parent)) {
                    last = last.parentPath
                  }
                  dealRemove(last.parentPath)
                  return
                } else {
                  canDel && (canDel = false)
                }
              }
              if (canDel) {
                // 'object' 的判断，要在 'argument' 之前,为了处理 !a.length 之类的语句
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
                  const p = last.parent
                  const name = p.callee.name || (p.callee.property && p.callee.property.name)
                  if (name === '_i') { // wx:for
                    canDel = false
                  } else if (name && (name === '_p' || hash[name])) { // this._p() || Number(a)
                    last = last.parentPath
                  } else {
                    canDel = false
                  }
                }
                if (inConditional) {
                  let cur = last
                  while (cur) { // (a & !b[key]) ? c : 'd'
                    const { key } = cur
                    if (key === 'test') {
                      canDel = false
                      break
                    }
                    if (key === 'consequent' || key === 'alternate') {
                      replace = true
                      break
                    }
                    cur = cur.parentPath
                  }
                }
                if (t.isBinaryExpression(last.container) || // a + b
                  t.isLogicalExpression(last.container) || // a && !b
                  (last.key === 'value' && t.isObjectProperty(last.container)) // ({ key: a && !b })
                ) {
                  replace = true
                }
              }

              const { currentBindings } = scopeBlock.get(currentBlock)
              if (currentBindings[keyPath]) {
                if (canDel) {
                  dealRemove(last, replace)
                } else {
                  // 当前变量不能被删除则删除前一个变量 & 更新节点为当前节点
                  const { canDel: preCanDel, path: prePath, replace: preReplace, current: preCurrent } = currentBindings[keyPath]
                  if (preCanDel && preCurrent === currentBlock) { // 当前作用域不能删除父级作用域的变量
                    dealRemove(prePath, preReplace)
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
