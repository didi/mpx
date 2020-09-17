/*
*** Mpx转快应用工具函数库
 */

module.exports = {
  isObjectEmpty: (obj) => {
    return JSON.stringify(obj) === '{}'
  },
  obj2Json: (obj) => {
    return JSON.stringify(obj)
  },
  json2Obj: (json) => {
    return JSON.parse(json)
  }
}
