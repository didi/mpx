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
function checkBindThis (path) {
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

function checkDelAndGetPath (path) {
  let current = path
  let delPath = current
  let propsPath = null
  let isPros = false

  // case: !!name
  while (t.isUnaryExpression(current.parent) && current.key === 'argument') {
    current = current.parentPath
    delPath = current
  }

  // case: Number(a); this._p(a); this.test(this._p(a))
  while (current) {
    if (t.isBlockStatement(current)) break // block 即可退出循环

    const { listKey, parent } = current
    if (listKey === 'arguments' && t.isCallExpression(parent)) {
      const args = parent.arguments
      if (args.length === 1) {
        const callee = parent.callee
        const name = callee.property && callee.property.name // 确认是否要考虑 this['_p'](a)
        if (name === '_p') { // 收集props
          isPros = true
        }
        propsPath = parent
        current = current.parentPath
        continue
      }
    }
    current = current.parentPath
  }

  while (current) {
    if (t.isBlockStatement(current)) break

    const { key, computed, node, container } = current
    if (
      computed ||
      key === 'property' ||
      (node.computed && !t.isStringLiteral(node.property)) ||
      t.isLogicalExpression(container) ||
      (t.isIfStatement(container) && key === 'test')
    ) return result({ canDel: false })

    if (t.isConditionalExpression(container)) return result(key === 'test' ? { canDel: false } : { ignore: true })

    if (t.isBinaryExpression(container)) return result({ replace: true }) // TODO 确认 a + b 删除报错类型

    current = current.parentPath
  }

  function result(obj) {
    return Object.assign({
      isPros,
      propsPath
    }, obj)
  }

  return result({
    canDel: true,
    delPath
  })
}

function checkPrefix (keys, key) {
  if (keys.length === 0) return false

  const temp = key.split('.')
  if (temp.length === 1) return false

  keys.forEach(str => {
    if (key.startsWith(str)) return true
  })

  return false
}

function dealRemove (path) {
  while (path.key === 'expression' && t.isExpressionStatement(path.parentPath)) {
    path = path.parentPath
  }

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
      Identifier (path) {
        if (
          checkBindThis(path) &&
          !path.scope.hasBinding(path.node.name) &&
          !ignoreMap[path.node.name]
        ) {
          path.shouldBindThis = true

          if (needCollect) {
            const { last, keyPath, hasDangerous } = calPropName(path)
            path.keyPath = keyPath
            path.lastPath = last

            if (!renderReduce) return

            const { isPros, propsPath, ignore, canDel, delPath, replace } = checkDelAndGetPath(hasDangerous ? last.parentPath : last)
            if (isPros) {
              propKeys.push(path.node.name)
              propsPath.replaceWith(propsPath.arguments[0])
            }
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
        if (path.shouldBindThis) {
          delete path.shouldBindThis

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

              if (checkPrefix(Object.keys(allBindings), keyPath) || pBindings[keyPath]) {
                doDelete()
                return
              } else {
                const currentBlockVars = bindings[keyPath]
                if (currentBlockVars.length > 1) {
                  const index = currentBlockVars.findIndex(item => !item.canDel)
                  if (index !== -1 || currentBlockVars[0].path !== path) { // 当前block中存在不可删除的变量或不是第一个可删除变量，即可删除该变量
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
