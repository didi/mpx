const babylon = require('@babel/parser')
const traverse = require('@babel/traverse').default
const t = require('@babel/types')
const generate = require('@babel/generator').default
const isValidIdentifierStr = require('../utils/is-valid-identifier-str')

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
function getCollectPath (path) {
  let current = path.parentPath
  let last = path
  let keyPath = '' + path.node.name

  while (current.isMemberExpression() && last.parentKey !== 'property') {
    if (current.node.computed) {
      if (t.isLiteral(current.node.property)) {
        if (t.isStringLiteral(current.node.property)) {
          if (dangerousKeyMap[current.node.property.value] || !isValidIdentifierStr(current.node.property.value)) {
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

  return {
    last,
    keyPath
  }
}

function checkDelAndGetPath (path) {
  let current = path
  let delPath = path
  let canDel = true // 是否可删除，优先级比replace高
  let ignore = false
  let replace = false

  // 确定删除路径
  while (!t.isBlockStatement(current) && !t.isProgram(current)) {
    // case: !!a
    if (t.isUnaryExpression(current.parent) && current.key === 'argument') {
      delPath = current.parentPath
    } else if (t.isCallExpression(current.parent)) {
      const args = current.parent.arguments || []
      if (
        // case: String(a) || this._p(a)
        args.length === 1 ||
        // 除了自身，参数列表里只能是数字或字符串才能删
        (args.every(node => node === current.node || t.isNumericLiteral(node) || t.isStringLiteral(node)))
      ) {
        delPath = current.parentPath
      } else {
        break
      }
    } else if (t.isMemberExpression(current.parent)) { // case: String(a,'123').b.c
      if (current.parent.computed) { // case: a['b'] or a.b['c.d']
        if (t.isLiteral(current.parent.property)) {
          delPath = current.parentPath
        } else { // case: a[b]
          break
        }
      } else {
        delPath = current.parentPath
      }
    } else if (t.isLogicalExpression(current.parent)) { // 只处理case: a || '' or '123' || a
      const key = current.key === 'left' ? 'right' : 'left'
      if (t.isLiteral(current.parent[key])) {
        delPath = current.parentPath
      } else {
        break
      }
    } else if (current.key === 'expression' && t.isExpressionStatement(current.parentPath)) { // dealRemove删除节点时需要
      delPath = current.parentPath
    } else {
      break
    }

    current = current.parentPath
  }

  // 确定是否可删除
  while (!t.isBlockStatement(current) && !t.isProgram(current)) {
    const { key, listKey, parent } = current

    if (t.isIfStatement(parent) && key === 'test') {
      canDel = false
      break
    }

    if (t.isCallExpression(parent) && listKey === 'arguments') {
      canDel = false
    }

    if (t.isMemberExpression(parent) && parent.computed) {
      canDel = false
    }

    if (t.isLogicalExpression(parent)) { // case: a || ((b || c) && d)
      canDel = false
      ignore = true
    }

    if (t.isConditionalExpression(parent)) {
      if (key === 'test') {
        canDel = false
      } else {
        ignore = true
        replace = true // 继续往上找，判断是否存在if条件等
      }
    }

    if (t.isBinaryExpression(parent)) { // 运算 a + b
      replace = true // 不能break，case: if (a + b) {}
    }

    if (t.isObjectProperty(parent) && key === 'value') { // ({ name: a })
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

// 判断前缀是否存在(只判断前缀，全等的情况，会返回false)
function checkPrefix (keys, key) {
  for (const item of keys) {
    if (checkBIsPrefixOfA(key, item)) return true
  }
  return false
}

function checkBIsPrefixOfA (a, b) {
  return a.startsWith(b) && (a[b.length] === '.' || a[b.length] === '[')
}

function dealRemove (path, replace) {
  try {
    if (replace) {
      path.replaceWith(t.stringLiteral(''))
    } else {
      if (path.inList) {
        t.validate(path.parent, path.key, [null])
      } else {
        t.validate(path.parent, path.key, null)
      }
      path.remove()
    }
    delete path.needBind
    delete path.collectInfo
  } catch (e) {
  }
}

function isSimpleKey (key) {
  return !/[[.]/.test(key)
}

module.exports = {
  transformSimple (code, {
    ignoreMap = {}
  }) {
    const ast = babylon.parse(code, {
      plugins: [
        'objectRestSpread'
      ]
    })
    const collectKeySet = new Set()
    const propKeySet = new Set()
    let isProps = false
    const visitor = {
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
            isProps = false
            delete path.isProps
          }
        }
      },
      Identifier (path) {
        if (
          checkBindThis(path) &&
          !ignoreMap[path.node.name] &&
          !path.scope.hasBinding(path.node.name)
        ) {
          if (isProps) {
            propKeySet.add(path.node.name)
          }
          const { keyPath } = getCollectPath(path)
          collectKeySet.add(keyPath)
        }
      }
    }
    traverse(ast, visitor)
    const collectKeys = [...collectKeySet]
    const pCollectKeys = collectKeys.filter((keyA) => {
      return collectKeys.every((keyB) => {
        return !checkBIsPrefixOfA(keyA, keyB)
      })
    })
    return {
      code: pCollectKeys.map((key) => {
        return isSimpleKey(key) ? `_sc(${JSON.stringify(key)});` : `_c(${JSON.stringify(key)});`
      }).join('\n'),
      propKeys: [...propKeySet]
    }
  },
  transform (code, {
    needCollect = false,
    renderReduce = false,
    ignoreMap = {},
    customBindThis
  } = {}) {
    const ast = babylon.parse(code, {
      plugins: [
        'objectRestSpread'
      ]
    })

    let currentBlock = null
    const bindingsMap = new Map()

    const propKeySet = new Set()
    let isProps = false

    const blockCollectVisitor = {
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
    }

    const collectVisitor = {
      Program: blockCollectVisitor,
      BlockStatement: blockCollectVisitor,
      Identifier (path) {
        if (
          checkBindThis(path) &&
          !ignoreMap[path.node.name]
        ) {
          const scopeBinding = path.scope.hasBinding(path.node.name)
          // 删除局部作用域的变量
          if (scopeBinding) {
            if (renderReduce) {
              const { delPath, canDel, replace } = checkDelAndGetPath(path)
              if (canDel) {
                delPath.delInfo = {
                  isLocal: true,
                  replace
                }
              }
            }
            return
          }
          path.needBind = true
          const { last, keyPath } = getCollectPath(path)
          if (needCollect) {
            last.collectInfo = {
              key: t.stringLiteral(keyPath),
              isSimple: isSimpleKey(keyPath)
            }
          }

          if (!renderReduce) return

          const { delPath, canDel, ignore, replace } = checkDelAndGetPath(path)

          if (canDel) {
            delPath.delInfo = {
              keyPath,
              replace
            }
          }

          if (ignore) return // ignore不计数，不需要被统计

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

    const blockBindVisitor = {
      enter (path) {
        const scope = bindingsMap.get(path)
        const parentScope = bindingsMap.get(scope.parent)
        scope.pBindings = parentScope ? Object.assign({}, parentScope.bindings, parentScope.pBindings) : {}
        currentBlock = path
      },
      exit (path) {
        currentBlock = bindingsMap.get(path).parent
      }
    }

    const bindVisitor = {
      Program: blockBindVisitor,
      BlockStatement: blockBindVisitor,
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
            path.replaceWith(args)
            isProps = false
            delete path.isProps
          }
        }
      },
      // enter 先于特定标识执行
      enter (path) {
        // 删除重复变量
        if (path.delInfo) {
          const { keyPath, isLocal, replace } = path.delInfo
          delete path.delInfo

          if (isLocal) { // 局部作用域里的变量，可直接删除
            dealRemove(path, replace)
            return
          }
          const data = bindingsMap.get(currentBlock)
          const { bindings, pBindings } = data
          const allBindings = Object.assign({}, pBindings, bindings)

          // 优先判断前缀，再判断全等
          if (checkPrefix(Object.keys(allBindings), keyPath) || pBindings[keyPath]) {
            dealRemove(path, replace)
          } else {
            const currentBlockVars = bindings[keyPath] || [] // 对于只出现一次的可忽略变量，需要兜底
            if (currentBlockVars.length >= 1) {
              const index = currentBlockVars.findIndex(item => !item.canDel)
              if (index !== -1 || currentBlockVars[0].path !== path) { // 当前block中存在不可删除的变量 || 不是第一个可删除变量，即可删除该变量
                dealRemove(path, replace)
              }
            }
          }
        }

        // bind this 将 a 转换成 this.a
        if (path.needBind) {
          const name = path.node.name
          if (name) { // 确保path没有被删除 且 没有被替换成字符串
            if (isProps) {
              propKeySet.add(name)
            }
            if (typeof customBindThis === 'function') {
              customBindThis(path, t)
            } else {
              path.replaceWith(t.memberExpression(t.thisExpression(), path.node))
            }
          }
          delete path.needBind
        }
      },
      MemberExpression: {
        exit (path) {
          if (path.collectInfo) {
            const { isSimple, key } = path.collectInfo
            const callee = isSimple ? t.identifier('_sc') : t.identifier('_c')
            const replaceNode = renderReduce
              ? t.callExpression(callee, [key])
              : t.callExpression(callee, [key, path.node])
            path.node && path.replaceWith(replaceNode)
            delete path.collectInfo
          }
        }
      }
    }

    traverse(ast, collectVisitor)
    traverse(ast, bindVisitor)

    return {
      code: generate(ast).code,
      propKeys: [...propKeySet]
    }
  }
}
