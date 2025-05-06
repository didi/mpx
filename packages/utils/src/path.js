let curStack
let targetStacks
let property

class Stack {
  constructor (mark) {
    this.mark = mark
    // 字符串stack需要特殊处理
    this.type = /['"]/.test(mark) ? 'string' : 'normal'
    this.value = []
  }

  push (data) {
    this.value.push(data)
  }
}

function startStack (mark) {
  // 开启栈或关闭栈都意味着前面的字符拼接截止
  propertyJoinOver()
  curStack && targetStacks.push(curStack)
  curStack = new Stack(mark)
}

function endStack () {
  // 开启栈或关闭栈都意味着前面的字符拼接截止
  propertyJoinOver()
  // 字符串栈直接拼接
  const result = curStack.type === 'string' ? '__mpx_str_' + curStack.value.join('') : curStack.value
  curStack = targetStacks.pop()
  // 将当前stack结果保存到父级stack里
  curStack.push(result)
}

function propertyJoinOver () {
  property = property.trim()
  if (property) curStack.push(property)
  property = ''
}

function init () {
  property = ''
  // 根stack
  curStack = new Stack()
  targetStacks = []
}

function parse (str) {
  init()
  for (const char of str) {
    // 当前遍历引号内的字符串时
    if (curStack.type === 'string') {
      // 若为对应的结束flag，则出栈，反之直接push
      curStack.mark === char ? endStack() : curStack.push(char)
    } else if (/['"[]/.test(char)) {
      startStack(char)
    } else if (char === ']') {
      endStack()
    } else if (char === '.' || char === '+') {
      propertyJoinOver()
      if (char === '+') curStack.push(char)
    } else {
      property += char
    }
  }
  // 字符解析收尾
  propertyJoinOver()
  return curStack.value
}

function outPutByPath (context, path, isSimple, transfer) {
  let result = context
  const len = path.length
  const meta = {
    isEnd: false,
    stop: false
  }
  for (let index = 0; index < len; index++) {
    if (index === len - 1) meta.isEnd = true
    let key
    const item = path[index]
    if (result) {
      if (isSimple) {
        key = item
      } else if (Array.isArray(item)) {
        // 获取子数组的输出结果作为当前key
        key = outPutByPath(context, item, isSimple, transfer)
      } else if (/^__mpx_str_/.test(item)) {
        // 字符串一定会被[]包裹，一定在子数组中
        result = item.replace('__mpx_str_', '')
      } else if (/^\d+$/.test(item)) {
        // 数字一定会被[]包裹，一定在子数组中
        result = +item
      } else if (item === '+') {
        // 获取加号后面所有path最终的结果
        result += outPutByPath(context, path.slice(index + 1), isSimple, transfer)
        break
      } else {
        key = item
      }
      if (key !== undefined) {
        result = transfer ? transfer(result, key, meta) : result[key]
        if (meta.stop) break
      }
    } else {
      break
    }
  }
  return result
}

function doGetByPath (context, pathStrOrArr, transfer) {
  if (!pathStrOrArr) {
    return context
  }
  let isSimple = false
  if (Array.isArray(pathStrOrArr)) {
    isSimple = true
  } else if (!/[[\]]/.test(pathStrOrArr)) {
    pathStrOrArr = pathStrOrArr.split('.')
    isSimple = true
  }

  if (!isSimple) pathStrOrArr = parse(pathStrOrArr)

  return outPutByPath(context, pathStrOrArr, isSimple, transfer)
}

function isExist (obj, attr) {
  const type = typeof obj
  const isNullOrUndefined = obj === null || obj === undefined
  if (isNullOrUndefined) {
    return false
  } else if (type === 'object' || type === 'function') {
    return attr in obj
  } else {
    return obj[attr] !== undefined
  }
}

function getByPath (data, pathStrOrArr, defaultVal, errTip) {
  const result = doGetByPath(data, pathStrOrArr, (value, key) => {
    let newValue
    if (isExist(value, key)) {
      newValue = value[key]
    } else {
      newValue = errTip
    }
    return newValue
  })
  // 小程序setData时不允许undefined数据
  return result === undefined ? defaultVal : result
}

function setByPath (data, pathStrOrArr, value) {
  if (!mpxGlobal.__mpx) {
    console.warn('[Mpx utils warn]: Can not find "mpxGlobal.__mpx", "setByPath" may encounter some potential problems!')
  }
  doGetByPath(data, pathStrOrArr, (current, key, meta) => {
    if (meta.isEnd) {
      if (mpxGlobal.__mpx) {
        mpxGlobal.__mpx.set(current, key, value)
      } else {
        current[key] = value
      }
    } else if (!current[key]) {
      current[key] = {}
    }
    return current[key]
  })
}

function getFirstKey (path) {
  return /^[^[.]*/.exec(path)[0]
}

function aIsSubPathOfB (a, b) {
  if (a.startsWith(b) && a !== b) {
    const nextChar = a[b.length]
    if (nextChar === '.') {
      return a.slice(b.length + 1)
    } else if (nextChar === '[') {
      return a.slice(b.length)
    }
  }
}

export {
  getByPath,
  setByPath,
  doGetByPath,
  getFirstKey,
  aIsSubPathOfB
}
