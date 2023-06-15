const babylon = require('@babel/parser')
const traverse = require('@babel/traverse').default
const t = require('@babel/types')
const generate = require('@babel/generator').default
// const { MultiNode, clearCache } = require('../utils/multi-node.js')

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

  // case: Number(a); this._p(a); this._p(wxs.test(a))
  while (current) {
    if (t.isBlockStatement(current)) break // block 即可退出循环

    const { listKey, parent } = current
    if (listKey === 'arguments' && t.isCallExpression(parent)) {
      const args = parent.arguments
      if (args.length === 1) {
        const callee = parent.callee
        const name = callee.property && callee.property.name // 确认是否要考虑 this['_p'](a)
        if (name === '_p') isPros = true // 收集props
        current = current.parentPath
        propsPath = current
        continue
      }
    }
    current = current.parentPath
  }

  while (current) {
    if (t.isBlockStatement(current)) break

    const { key, computed, node, container } = current
    if (
      computed || // a[b] => a
      key === 'property' || // a[b] => b
      (node.computed && !t.isStringLiteral(node.property)) || // a.b[c] => a.b TODO 注释补全
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

function dealRemove (path, replace) {
  if (replace) { // TODO 优化，看是否可以挪到下面
    path.replaceWith(t.stringLiteral(''))
    return
  }

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

    let currentBlock = null
    const bindingsMap = new Map()

    const propKeys = []

    const collectVisitor = {
      Program: {
        enter (path) {
          bindingsMap.set(path, {
            parent: null,
            bindings: {},
            pBindings: {}
          })
          currentBlock = path
        }
      },
      BlockStatement: {
        enter (path) { // 收集作用域下所有变量(keyPath)
          const parent = bindingsMap.get(currentBlock)
          bindingsMap.set(path, {
            parent,
            bindings: {},
            pBindings: {}
          })
          currentBlock = path
        },
        exit (path) {
          const scope = bindingsMap.get(path)
          const parentScope = bindingsMap.get(scope.parent)
          scope.pBindings = Object.assign({}, parentScope.bindings, parentScope.pBindings)
          currentBlock = scope.parent
        }
      },
      Identifier (path) {
        if (
          checkBindThis(path) &&
          !path.scope.hasBinding(path.node.name) &&
          !ignoreMap[path.node.name] &&
          needCollect
        ) {
          const { last, keyPath, hasDangerous } = calPropName(path)
          path.keyPath = keyPath
          last.collectPath = t.stringLiteral(keyPath)

          if (!renderReduce) return

          const {isPros, propsPath, ignore, delPath, canDel, replace} = checkDelAndGetPath(hasDangerous ? last.parentPath : last)
          if (isPros) {
            propKeys.push(path.node.name)
            propsPath.isPros = true
          }
          if (ignore) return

          delPath.delInfo = {
            keyPath,
            canDel,
            replace
          }

          const { bindings } = bindingsMap.get(currentBlock)
          const target = bindings[keyPath] || []
          target.push({
            path,
            canDel
          })
          bindings[keyPath] = target
        }
      }
    }

    const bindThisVisitor = {
      BlockStatement: {
        enter (path) {
          currentBlock = path
        },
        exit (path) {
          currentBlock = bindingsMap.get(path).parent
        }
      },
      enter (path) {
        // replace _p
        if (path.isPros) {
          path.replaceWith(path.node.arguments[0])
          delete path.isPros
        }

        // 删除重复变量
        if (path.delInfo) {
          const { keyPath, canDel, replace } = path.delInfo
          delete path.delInfo

          if (canDel) {
            const data = bindingsMap.get(currentBlock)
            const { bindings, pBindings } = data
            const allBindings = Object.assign({}, pBindings, bindings)

            // 优先判断前缀，在判断全等
            if (checkPrefix(Object.keys(allBindings), keyPath) || pBindings[keyPath]) {
              dealRemove(path)
              return
            } else {
              const currentBlockVars = bindings[keyPath]
              if (currentBlockVars.length > 1) {
                const index = currentBlockVars.findIndex(item => !item.canDel)
                if (index !== -1 || currentBlockVars[0].path !== path) { // 当前block中存在不可删除的变量 || 不是第一个可删除变量，即可删除该变量
                  dealRemove(path)
                  return
                }
              }
            }
          }
        }

        if (path.keyPath) {
          // bind this
          path.replaceWith(t.memberExpression(t.thisExpression(), path.node))
        }
      },
      Identifier (path) {
        return
        if (path.keyPath) {
          const keyPath = path.keyPath

          delete path.keyPath

          if (path.canDel || path.replace) {
            delete path.canDel
            const { data } = blockTree.get(currentBlock)
            const { bindings, pBindings } = data
            const allBindings = Object.assign({}, pBindings, bindings)

            const doDelete = () => {
              dealRemove(path.deleteLastPath, path.replace)
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

    return {
      code: generate(ast).code,
      propKeys
    }
  }
}
