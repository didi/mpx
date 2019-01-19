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
  const result = curStack.type === 'string' ? `'${curStack.value.join('')}'` : curStack.value
  curStack = targetStacks.pop()
  // 将当前stack结果保存到父级stack里
  curStack.push(result)
}

function propertyJoinOver () {
  property && curStack.push(property)
  property = ''
}

function init () {
  property = ''
  // 根stack
  curStack = new Stack()
  targetStacks = []
}

function parse (str) {
  // 重置全局数据
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
      char === '+' && curStack.push(char)
    } else {
      property += char.trim()
    }
  }
  // 字符解析收尾
  propertyJoinOver()
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
