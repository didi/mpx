const bindThis = require('./bind-this').transform

var result = bindThis('(m1.aa.s.asd);(asd.asd);(aaa.asd[m1.aa.s]);', { m1: true })
console.log(result.code)