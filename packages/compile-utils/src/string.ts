function isCapital(c: string) {
  return /[A-Z]/.test(c)
}

function isMustache(str: string) {
  return /\{\{((?:.|\n|\r)+?)\}\}(?!})/.test(str)
}

// WordExample/wordExample -> word-example
function capitalToHyphen(v: string) {
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

export {
  isCapital,
  isMustache,
  capitalToHyphen
}
