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
function calPropName (path) {
  let current = path.parentPath
  let last = path
  let keyPath = '' + path.node.name

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
    hasDangerous
  }
}

function checkDelAndGetPath (path, condition) {
  let cur = path
  let delPath = condition || cur
  while (cur) {
    const { key, computed, node, container } = cur
    if (
      computed ||
      key === 'property' ||
      (node.computed && !t.isStringLiteral(node.property)) ||
      t.isLogicalExpression(container) ||
      (t.isBinaryExpression(container) && t.isIdentifier(container.left) && t.isIdentifier(container.right)) ||
      (t.isIfStatement(container) && key === 'test')
    ) return { canDel: false }

    if (t.isConditionalExpression(container)) return key === 'test' ? { canDel: false } : { ignore: true }

    if (cur.key === 'argument') {
      while (t.isUnaryExpression(cur.parent) && cur.key === 'argument') {
        cur = cur.parentPath
        delPath = cur
      }
      continue
    }

    if (cur.listKey === 'arguments' && cur.key === 0 && t.isCallExpression(cur.parent)) {
      const callee = cur.parent.callee
      const name = callee.name || (callee.property && callee.property.name)
      if (name && hash[name]) { // Number(a)
        cur = cur.parentPath
        delPath = cur
        continue
      } else if (name === '_i') {
        return { canDel: false }
      }
    }

    cur = cur.parentPath
  }

  return {
    canDel: true,
    delPath
  }
}

function checkKeys (keys, key) {
  if (keys.length === 0) return false

  const temp = key.split('.')
  if (temp.length === 1) return false

  const map = new Map()
  keys.forEach(k => {
    map.set(k, 1)
  })

  while (temp.length) {
    temp.pop()
    if (map.get(temp.join('.'))) return true
  }

  return false
}

function dealRemove (path) {
  const removeParent = path.key === 'expression' && t.isExpressionStatement(path.parentPath)

  if (removeParent) return dealRemove(path.parentPath)

  try {
    t.validate(path, path.key, null)
    path.remove()
  } catch (e) {
    path.replaceWith(t.stringLiteral(''))
  }
}

module.exports = {
  transform (code, {
    needCollect = false,
    renderReduce = false,
    ignoreMap = {}
  } = {}) {
    const ast = babylon.parse(code, {
      plugins: [
        'objectRestSpread'
      ]
    })

    const propKeys = []
    let isProps = false

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
      BlockStatement: {
        enter (path) {
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
      Identifier (path) {
        if (judgeIdentifierName(path)) {
          if (!path.scope.hasBinding(path.node.name) && !ignoreMap[path.node.name]) {
            path.isIdentity = true

            if (needCollect) {
              if (isProps) {
                propKeys.push(path.node.name)
              }

              const { last, keyPath, hasDangerous } = calPropName(path)
              path.keyPath = keyPath
              path.lastPath = last

              if (!renderReduce) return

              const { canDel, delPath, ignore } = checkDelAndGetPath(hasDangerous ? last.parentPath : last)
              if (ignore) return

              path.canDel = canDel
              path.deleteLastPath = delPath

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
        if (path.isIdentity) {
          delete path.isIdentity

          if (path.keyPath) {
            const keyPath = path.keyPath
            const last = path.lastPath
            last.collectPath = t.stringLiteral(keyPath)

            delete path.keyPath
            delete path.lastPath

            if (path.canDel) {
              delete path.canDel
              const { data } = blockTree.get(currentBlock)
              const { bindings, pBindings } = data
              const allBindings = Object.assign({}, pBindings, bindings)

              const doDelete = () => {
                dealRemove(path.deleteLastPath)
                delete path.deleteLastPath
              }

              if (checkKeys(Object.keys(allBindings), keyPath) || pBindings[keyPath]) {
                doDelete()
                return
              } else {
                const currentBlockVars = bindings[keyPath]
                if (currentBlockVars.length > 1) {
                  const index = currentBlockVars.findIndex(item => !item.canDel)
                  if (index !== -1 || currentBlockVars[0].path !== path) {
                    doDelete()
                    return
                  }
                }
              }
            }

            // bind this
            path.replaceWith(t.memberExpression(t.thisExpression(), path.node))
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

    traverse(ast, collectVisitor)
    traverse(ast, bindThisVisitor)

    clearCache()

    return {
      code: generate(ast).code,
      propKeys
    }
  }
}
