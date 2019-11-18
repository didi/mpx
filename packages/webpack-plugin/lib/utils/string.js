function isCapital (c) {
  return /[A-Z]/.test(c)
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

module.exports = {
  isCapital,
  capitalToHyphen
}
