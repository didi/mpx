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
  let canDel = true
  let ignore = false
  let replace = false

  // case: !!name
  while (t.isUnaryExpression(current.parent) && current.key === 'argument') {
    current = current.parentPath
    delPath = current
  }

  // wxs.test() wxs.test 不可删除
  if (current.key === 'callee' && t.isCallExpression(current.parent)) {
    canDel = false
  }

  while (!t.isBlockStatement(current)) {
    if (t.isCallExpression(current)) { // 处理case: Number(a); this._p(a); this._p(wxs.test(a))
      const callee = current.node.callee
      const args = current.node.arguments || current.parent.arguments // Number(a) || this._p(a)
      if (args.length === 1) {
        const name = callee.name || (callee.property && callee.property.name) // Number(a) || this._p(a)
        if (!replaceArg) replaceArg = args // 保留第一个出现的参数 this._p(wxs.test(a)) => 把a保存下来，避免在replace时再次查找args
        if (name === '_p') {
          isPros = true // 收集props
          // replacePath = current
        }
        if (current.key === 'object' && t.isMemberExpression(current.parent)) { // Number(a).length
          replacePath = current.parentPath
          // delPath = current.parentPath
        } else {
          replacePath = current
          // delPath = current
        }
        current = current.parentPath
        continue
      } else {
        canDel = false
        break
      }
    }

    // 如果是this._p()，则可退出循环
    if (isPros) break

    const { key, computed, node, container } = current
    if (
      computed || // a[b] => a
      key === 'property' || // a[b] => b
      (node.computed && !t.isStringLiteral(node.property)) ||
      t.isLogicalExpression(container) ||
      (t.isIfStatement(container) && key === 'test')
    ) {
      canDel = false
    }

    if (t.isConditionalExpression(container)) {
      if (key === 'test') canDel = false
      else ignore = true
    }

    if (
      t.isBinaryExpression(container) ||
      (key === 'value' && t.isObjectProperty(container) && canDel) // ({ name: a }) and ({ name: a && !b })
    ) {
      canDel = true
      replace = true
    }

    current = current.parentPath
  }

  // 不可删除时，要把method相关路径清空，避免被删除；但是外层如果是_p，则需要删除
  if (!canDel && !isPros && replaceArg) { // Object.keys(a) ? b : c; Object.keys(a)不可删除; this._p(Object.keys(a)) 可删除
    replacePath = null
    replaceArg = null
  }
  return {
    isPros,
    delPath,
    replacePath,
    replaceArg,
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
          if (replacePath && replaceArg) replacePath.replaceArg = replaceArg
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
