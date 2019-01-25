const bindThis = require('./bind-this').transform

var result = bindThis('asdasd[aaa][123].aaa[sasd["asdsas"]];', {
  needKeyPath: true,
  ignoreMap: { m1: true }
})
console.log(result.code)
