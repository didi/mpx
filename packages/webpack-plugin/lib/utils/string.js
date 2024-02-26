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

module.exports = {
  isCapital,
  isMustache,
  capitalToHyphen,
  trimBlankRow
}
