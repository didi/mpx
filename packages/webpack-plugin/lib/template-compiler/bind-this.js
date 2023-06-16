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
  let isPros = false // 只用于收集 propKeys
  let replacePath = null
  let replaceArg = null

  // case: !!name
  while (t.isUnaryExpression(current.parent) && current.key === 'argument') {
    current = current.parentPath
    delPath = current
  }

  // case: Number(a); this._p(a); this._p(wxs.test(a))
  while (!t.isBlockStatement(current)) { // block 即可退出循环
    const { listKey, parent } = current
    if (listKey === 'arguments' && t.isCallExpression(parent)) {
      const args = parent.arguments
      if (args.length === 1) {
        const callee = parent.callee
        const name = callee.property && callee.property.name // 确认是否要考虑 this['_p'](a)
        if (name === '_p') isPros = true // 收集props
        if (!replaceArg) replaceArg = args
        current = current.parentPath
        replacePath = current
        continue
      } else {
        return result({ canDel: false })
      }
    }
    current = current.parentPath
  }

  current = path // 需要从头开始校验 case: this._p((a + b) || (c && d))
  while (!t.isBlockStatement(current)) {
    const { key, computed, node, container } = current
    if (
      computed || // a[b] => a
      key === 'property' || // a[b] => b
      (node.computed && !t.isStringLiteral(node.property)) ||
      t.isLogicalExpression(container) ||
      (t.isIfStatement(container) && key === 'test')
    ) return result({ canDel: false })

    if (t.isConditionalExpression(container)) return result(key === 'test' ? { canDel: false } : { ignore: true })

    if (
      t.isBinaryExpression(container) ||
      (key === 'value' && t.isObjectProperty(container)) // ({ name: a })
    ) return result({ canDel: true, replace: true })

    current = current.parentPath
  }

  function result (obj) {
    return Object.assign({
      isPros,
      delPath,
      replacePath,
      replaceArg
    }, obj)
  }

  return result({ canDel: true })
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

    const collectVisitor = {
      Program: {
        enter (path) {
          bindingsMap.set(path, {
            parent: null,
            bindings: {}
          })
          currentBlock = path
        }
      },
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

          const {
            isPros,
            replacePath,
            replaceArg,
            ignore,
            delPath,
            canDel,
            replace
          } = checkDelAndGetPath(hasDangerous ? last.parentPath : last)
          if (isPros) propKeys.push(path.node.name)
          if (replacePath) replacePath.replaceArg = replaceArg
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
          scope.pBindings = Object.assign({}, parentScope.bindings, parentScope.pBindings)
          currentBlock = path
        },
        exit (path) {
          currentBlock = bindingsMap.get(path).parent
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

        // bind this a => this.a
        if (path.keyPath) {
          const { name, value } = path.node || {}
          if (path.node && (name || value)) { // 确保path没有被删除 且 没有被替换成字符串
            path.replaceWith(t.memberExpression(t.thisExpression(), path.node))
          }
          delete path.keyPath
        }
      },
      exit (path) {
        // replace必须放在exit，因为如果在enter阶段做，可能会把挂载到path的delInfo、keyPath给删掉
        if (path.replaceArg) {
          const arg = path.replaceArg[0]
          arg ? path.replaceWith(arg) : dealRemove(path)
          delete path.replaceArg
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
