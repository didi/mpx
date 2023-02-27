const babylon = require('@babel/parser')
const traverse = require('@babel/traverse').default
const t = require('@babel/types')
const generate = require('@babel/generator').default
const { MultiNode, clearCache } = require('../utils/multi-node.js')

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

// 判断 Identifier 是否需要处理
function judgeIdentifierName (path) {
  return !(t.isDeclaration(path.parent) && path.parentKey === 'id') &&
    !(t.isFunction(path.parent) && path.listKey === 'params') &&
    !(t.isMethod(path.parent) && path.parentKey === 'key' && !path.parent.computed) &&
    !(t.isProperty(path.parent) && path.parentKey === 'key' && !path.parent.computed) &&
    !(t.isMemberExpression(path.parent) && path.parentKey === 'property' && !path.parent.computed) &&
    !t.isArrayPattern(path.parent) &&
    !t.isObjectPattern(path.parent) &&
    !hash[path.node.name]
}

// 计算访问路径
function calPropName (path, replaced) {
  let current = path.parentPath
  let last = path
  let keyPath = replaced
    ? '' + path.node.property.name
    : '' + path.node.name

  let hasComputed = false
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

  return {
    last,
    keyPath,
    hasComputed,
    hasDangerous
  }
}

// 校验是否真实可删
function checkIdentifierDel (last, opts) {
  const { hasDangerous, conditional } = opts
  let realDel = true
  let replace = false

  if (last.key === 'callee') {
    if (last.node.property.name === '$t') { // i18n直接删除
      if (t.isCallExpression(last.parent)) {
        last = last.parentPath
      }
      return {
        path: last.parentPath,
        realDel
      }
    }
  }

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
      realDel = false
    } else if (name && (name === '_p' || hash[name])) { // this._p() || Number(a)
      last = last.parentPath
    } else {
      realDel = false
    }
  }

  if (conditional === 'test') {
    realDel = false
  } else if (['consequent', 'alternate'].includes(conditional)) {
    replace = true
  }

  if (t.isBinaryExpression(last.container) || // a + b
    t.isLogicalExpression(last.container) || // a && !b
    (last.key === 'value' && t.isObjectProperty(last.container)) // ({ key: a && !b })
  ) {
    replace = true
  }

  return {
    path: last,
    realDel,
    replace
  }
}

function checkInConditional (last) {
  let cur = last
  let position = ''
  while (cur) {
    const { key } = cur
    if (key === 'test') {
      position = key
      break
    }
    if (key === 'consequent' || key === 'alternate') {
      position = key
      break
    }
    cur = cur.parentPath
  }
  return position
}

function dealRemove (path, isReplace) {
  if (isReplace) {
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
    // 纪录每个作用域下的变量，以便回溯删除
    let blockTree = null
    let currentBlock = null

    const collectVisitor = {
      Program: {
        enter (path) {
          blockTree = new MultiNode(null, {
            path,
            bindings: {}
          }, [])
          currentBlock = path
        }
      },
      IfStatement: {
        enter (path) {
          inIfTest = true
          const consequent = path.get('consequent')
          if (!t.isBlockStatement(consequent)) { // 避免出现 if (a) name 之类的语句
            consequent.replaceWith(t.blockStatement([consequent]))
          }
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
      BlockStatement: {
        enter (path) {
          inIfTest && (inIfTest = false)

          const scope = blockTree.get(currentBlock)
          scope.add(new MultiNode(currentBlock, {
            path,
            bindings: {}
          }, []))
          currentBlock = path
        },
        exit (path) {
          const scope = blockTree.get(path)
          currentBlock = scope.parent
        }
      },
      Identifier (path) {
        if (judgeIdentifierName(path)) {
          if (!path.scope.hasBinding(path.node.name) && !ignoreMap[path.node.name]) {
            path.judge = true

            if (needCollect) {
              const { last, keyPath, hasComputed, hasDangerous } = calPropName(path)
              path.keyPath = keyPath
              if (last !== path) {
                path.lastPath = last
              }

              let replace = false
              let position = ''
              let canDel = !inIfTest &&
                !hasComputed &&
                last.key !== 'property' &&
                last.parentPath.key !== 'property'

              if (inConditional) {
                position = checkInConditional(last)
                if (inIfTest && position !== 'test') {
                  return // if (a ? b : c) // 变量 b 和 c 不收集
                }
                if (position === 'test') {
                  canDel = false
                }
              }
              if (canDel) {
                const { path: deletePath, realDel, replace: canReplace } = checkIdentifierDel(last, {
                  hasDangerous,
                  conditional: position
                })
                canDel = realDel
                replace = canReplace
                path.deleteLastPath = deletePath
              }
              path.canDel = canDel
              path.replace = replace

              const current = blockTree.get(currentBlock)
              const target = current.data.bindings[keyPath] || []
              target.push({
                path,
                canDel
              })
              current.data.bindings[keyPath] = target
            }
          }
        }
      }
    }

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
          const scope = blockTree.get(path)
          const { data } = blockTree.get(scope.parent)
          scope.data.pBindings = Object.assign({}, data.bindings, data.pBindings)
          currentBlock = path
        },
        exit (path) {
          const scope = blockTree.get(path)
          currentBlock = scope.parent
        }
      },
      Identifier (path) {
        if (path.judge) {
          // bind this
          path.replaceWith(t.memberExpression(t.thisExpression(), path.node))

          if (isProps) {
            propKeys.push(path.node.property.name)
          }

          if (path.keyPath) {
            const keyPath = path.keyPath
            const last = path.lastPath || path
            last.collectPath = t.stringLiteral(keyPath)

            if (path.canDel) {
              const { data } = blockTree.get(currentBlock)
              const { bindings, pBindings } = data
              const currentBlockVars = bindings[keyPath]

              const doDelete = () => {
                dealRemove(path.deleteLastPath, path.replace)
                delete path.deleteLastPath
                delete path.replace
              }

              if (pBindings[keyPath]) {
                doDelete()
              } else {
                if (currentBlockVars.length > 1) {
                  const index = currentBlockVars.findIndex(item => !item.canDel)

                  if (index === -1) {
                    if (currentBlockVars[0].path !== path) {
                      doDelete()
                    }
                  } else {
                    doDelete()
                  }
                }
              }
            }

            delete path.keyPath
            delete path.canDel
            delete path.lastPath
          }
          delete path.judge
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

    traverse(ast, collectVisitor)
    traverse(ast, bindThisVisitor)

    clearCache()

    return {
      code: generate(ast).code,
      propKeys
    }
  }
}
