function makeMap (arr) {
  return arr.reduce((obj, item) => {
    obj[item] = true
    return obj
  }, {})
}

function findItem (arr = [], key) {
  for (const item of arr) {
    if ((key instanceof RegExp && key.test(item)) || item === key) {
      return true
    }
  }
  return false
}

function remove (arr, item) {
  if (arr.length) {
    const index = arr.indexOf(item)
    if (index > -1) {
      return arr.splice(index, 1)
    }
  }
}

// 微信小程序插件环境2.8.3以下基础库protoAugment会失败，对环境进行测试按需降级为copyAugment
function testArrayProtoAugment () {
  const arr = []
  /* eslint-disable no-proto, camelcase */
  arr.__proto__ = { __array_proto_test__: '__array_proto_test__' }
  return arr.__array_proto_test__ === '__array_proto_test__'
}

const arrayProtoAugment = testArrayProtoAugment()

function isValidArrayIndex (val) {
  const n = parseFloat(String(val))
  return n >= 0 && Math.floor(n) === n && isFinite(val)
}

function normalizeMap (prefix, arr) {
  if (typeof prefix !== 'string') {
    arr = prefix
    prefix = ''
  }
  if (Array.isArray(arr)) {
    const map = {}
    arr.forEach(value => {
      map[value] = prefix ? `${prefix}.${value}` : value
    })
    return map
  }
  if (prefix && isObject(arr)) {
    arr = Object.assign({}, arr)
    Object.keys(arr).forEach(key => {
      if (typeof arr[key] === 'string') {
        arr[key] = `${prefix}.${arr[key]}`
      }
    })
  }
  return arr
}

export {
  arrayProtoAugment,
  makeMap,
  findItem,
  remove,
  isValidArrayIndex,
  normalizeMap
}
