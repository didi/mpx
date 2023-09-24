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
  let delPath = path
  let canDel = true
  let ignore = false
  let replace = false

  // 确定删除路径
  let tempPath = current
  while (!t.isBlockStatement(tempPath)) {
    // case: !!a
    while (t.isUnaryExpression(tempPath.parent) && tempPath.key === 'argument') {
      tempPath = tempPath.parentPath
      delPath = tempPath
    }

    // 遇到复杂表达式，则直接停止，避免同一个path挂载多个delInfo
    if (t.isBinaryExpression(tempPath.container) ||
      t.isLogicalExpression(tempPath.container) ||
      t.isObjectProperty(tempPath.container)) {
      break
    }

    if (t.isCallExpression(tempPath)) {
      // case: String(a) || this._p(a)
      const args = tempPath.node.arguments || tempPath.parent.arguments || []
      if (args.length === 1) {
        delPath = tempPath
      }
    }
    // case: String(a).length
    if (tempPath.type === 'MemberExpression' && t.isCallExpression(tempPath.node.object)) {
      delPath = tempPath
    }

    tempPath = tempPath.parentPath
  }

  // 确定是否可删除
  while (!t.isBlockStatement(current)) {
    const { key, listKey, computed, node, container } = current
    if (
      computed || // a[b] => a
      key === 'property' || // a[b] => b
      (node.computed && !t.isStringLiteral(node.property)) || // a['b']
      t.isLogicalExpression(container) || // a && b
      (t.isIfStatement(container) && key === 'test') || // if (a) {}
      (key === 0 && container.length > 1 && listKey === 'arguments') // this._i(a, function() {})
    ) {
      canDel = false
      break
    }

    if (t.isConditionalExpression(container)) {
      if (key === 'test') canDel = false
      else ignore = true
      break
    }

    if (
      t.isBinaryExpression(container) || // 运算 a + b
      (key === 'value' && t.isObjectProperty(container) && canDel) // ({ name: a }) and ({ name: a && !b })
    ) {
      canDel = true
      replace = true
    }

    current = current.parentPath
  }

  return {
    delPath,
    canDel,
    ignore,
    replace
  }
}

function checkPrefix (keys, key) {
  if (keys.length === 0) return false
  const temp = key.split('.')
  if (temp.length === 1) return false

  for (let i = 0; i < keys.length; i++) {
    const str = keys[i]
    if (key.startsWith(str)) return true
  }
  return false
}

function dealRemove (path, replace) {
  while (path.key === 'expression' && t.isExpressionStatement(path.parentPath)) {
    path = path.parentPath
  }

  try {
    if (replace) {
      path.replaceWith(t.stringLiteral(''))
    } else {
      t.validate(path, path.key, null)
      path.remove()
    }
  } catch (e) {
    console.error(e)
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
    let isProps = false

    const collectVisitor = {
      BlockStatement: {
        enter (path) { // 收集作用域下所有变量(keyPath)
          bindingsMap.set(path, {
            parent: currentBlock,
            bindings: {}
          })
          currentBlock = path
        },
        exit (path) {
          currentBlock = bindingsMap.get(path).parent
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

          const { delPath, canDel, ignore, replace } = checkDelAndGetPath(hasDangerous ? last.parentPath : last)
          if (ignore) return

          delPath.delInfo = {
            keyPath,
            canDel,
            replace
          }

          const { bindings } = bindingsMap.get(currentBlock)
          const target = bindings[keyPath] || []
          target.push({
            path: delPath,
            canDel
          })
          bindings[keyPath] = target
        }
      }
    }

    const bindThisVisitor = {
      BlockStatement: {
        enter (path) {
          const scope = bindingsMap.get(path)
          const parentScope = bindingsMap.get(scope.parent)
          scope.pBindings = parentScope ? Object.assign({}, parentScope.bindings, parentScope.pBindings) : {}
          currentBlock = path
        },
        exit (path) {
          currentBlock = bindingsMap.get(path).parent
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
            const args = path.node.arguments[0]
            if (args) {
              path.replaceWith(args)
            } else {
              // 查找可删除路径时，有可能查不多_p就结束了，类似: this._p(String(a + b))，所以遇到没有参数的场景，很可能就是依据被删除了
              path.remove()
            }
            isProps = false
            delete path.isProps
          }
        }
      },
      enter (path) {
        // 删除重复变量
        if (path.delInfo) {
          const { keyPath, canDel, replace } = path.delInfo
          delete path.delInfo

          if (canDel) {
            const data = bindingsMap.get(currentBlock)
            const { bindings, pBindings } = data
            const allBindings = Object.assign({}, pBindings, bindings)

            // 优先判断前缀，再判断全等
            if (checkPrefix(Object.keys(allBindings), keyPath) || pBindings[keyPath]) {
              dealRemove(path, replace)
              return
            } else {
              const currentBlockVars = bindings[keyPath]
              if (currentBlockVars.length > 1) {
                const index = currentBlockVars.findIndex(item => !item.canDel)
                if (index !== -1 || currentBlockVars[0].path !== path) { // 当前block中存在不可删除的变量 || 不是第一个可删除变量，即可删除该变量
                  dealRemove(path, replace)
                  return
                }
              }
            }
          }
        }

        // bind this 将 a 转换成 this.a
        if (path.keyPath) {
          const { name } = path.node || {}
          if (isProps) {
            propKeys.push(name)
          }
          if (name) { // 确保path没有被删除 且 没有被替换成字符串
            path.replaceWith(t.memberExpression(t.thisExpression(), path.node))
          }
          delete path.keyPath
        }
      },
      MemberExpression: {
        exit (path) {
          if (path.collectPath) {
            path.node && path.replaceWith(t.callExpression(t.memberExpression(t.thisExpression(), t.identifier('_c')), [path.collectPath, path.node]))
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
