const bindThis = require('./bind-this').transform

var result = bindThis('someData[m1.someKey];', {
  needTravel: false,
  needKeyPath: true,
  ignoreMap: { m1: true }
})
console.log(result.code)
