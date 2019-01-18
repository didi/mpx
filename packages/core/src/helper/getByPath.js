let curStack
let targetStacks
let varibale
class Stack {
  constructor (type) {
    this.type = type
    this.value = []
    this.hasPlus = false
  }
  push (data) {
    this.value.push(data)
  }
}

function startStack (type) {
  // 开启栈或关闭栈都意味着前面的字符拼接截止
  varibaleFinish()
  curStack && targetStacks.push(curStack)
  curStack = new Stack(type)
}

function endStack (type) {
  // 开启栈或关闭栈都意味着前面的字符拼接截止
  varibaleFinish()
  // 字符串栈直接拼接
  const result = curStack.type === 'string' ? `'${curStack.value.join('')}'` : curStack.value
  curStack = targetStacks.pop()
  // 将当前stack结果保证到父级stack里
  curStack.push(result)
}

function varibaleFinish () {
  varibale && curStack.push(varibale)
  varibale = ''
}

function init () {
  varibale = ''
  curStack = new Stack()
  targetStacks = []
}

function parse (str) {
  // 重置全局数据
  init()
  for (const char of str) {
    if (/['"]/.test(char)) {
      curStack.type === 'string' ? endStack('string') : startStack('string')
    } else if (curStack.type === 'string') {
      // 引号内的字符，直接push
      curStack.push(char)
    } else if (char === '[') {
      startStack()
    } else if (char === ']') {
      endStack()
    } else if (char === '.' || char === '+') {
      varibaleFinish()
      char === '+' && curStack.push(char)
    } else {
      varibale += char.trim()
    }
  }
  // 字符解析收尾
  varibaleFinish()
  return curStack.value
}

function outPutByPath (context, path, transfer) {
  let result = context
  const len = path.length
  for (let index = 0; index < len; index++) {
    const item = path[index]
    if (result) {
      if (Object.prototype.toString.call(item) === '[object Array]') {
        // 数组最终得到一个key
        const key = outPutByPath(context, item, transfer)
        result = transfer ? transfer(result, key) : result[key]
      } else if (/^'.+'$/.test(item) || /^\d+$/.test(item) && index === 0) {
        result = item.replace(/'/g, '')
      } else if (item === '+') {
        // 获取加号后面所有path最终的结果
        result += outPutByPath(context, path.slice(index + 1), transfer)
        break
      } else {
        result = transfer ? transfer(result, item) : result[item]
      }
    }
  }
  return result
}

export default function getByPath (context, pathStr, transfer) {
  if (!pathStr) {
    return context
  }
  return outPutByPath(context, parse(pathStr), transfer)
}
