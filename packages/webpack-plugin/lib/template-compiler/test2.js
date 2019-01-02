const bindThis = require('./bind-this').transform

var result = bindThis('(this.__checkIgnore(asdas211),this.__checkIgnore(m1.asdaa[asdss]));', {
  needTravel: true,
  needKeyPath: true,
  ignoreMap: { m1: true }
})
console.log(result.code)
