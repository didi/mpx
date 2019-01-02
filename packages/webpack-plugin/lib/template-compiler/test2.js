const bindThis = require('./bind-this').transform

var result = bindThis('(asdasd[m1.asdasd]);', {
  needTravel: true,
  needKeyPath: true,
  ignoreMap: { m1: true }
})
console.log(result.code)
