function isCapital (c) {
  return /[A-Z]/.test(c)
}

function isMustache (str) {
  return /\{\{((?:.|\n|\r)+?)\}\}(?!})/.test(str)
}

// WordExample/wordExample -> word-example
function capitalToHyphen (v) {
  let ret = ''
  for (let c, i = 0; i < v.length; i++) {
    c = v[i]
    if (isCapital(c)) {
      if (i === 0) {
        c = c.toLowerCase()
      } else {
        c = '-' + c.toLowerCase()
      }
    }
    ret += c
  }
  return ret
}

// 删除空行
function trimBlankRow (str) {
  return str.replace(/^\s*[\r\n]/gm, '')
}

// 多value解析
function parseValues (str, char = ' ') {
  let stack = 0
  let temp = ''
  const result = []
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '(') {
      stack++
    } else if (str[i] === ')') {
      stack--
    }
    // 非括号内 或者 非分隔字符且非空
    if (stack !== 0 || str[i] !== char) {
      temp += str[i]
    }
    if ((stack === 0 && str[i] === char) || i === str.length - 1) {
      result.push(temp.trim())
      temp = ''
    }
  }
  return result
}

module.exports = {
  isCapital,
  isMustache,
  capitalToHyphen,
  trimBlankRow,
  parseValues
}
