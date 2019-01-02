const bindThis = require('./bind-this').transform

var result = bindThis('(this.__checkIgnore(asdas211),this.__checkIgnore(m1.asdaa[asdss]),asdsss1123,m1[asadas[m1.asdsa[aaa][bbb]][asdssqw]]);', {
  needTravel: true,
  needKeyPath: true,
  ignoreMap: { m1: true }
})
console.log(result.code)
