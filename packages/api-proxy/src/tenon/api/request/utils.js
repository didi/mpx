export function queryParse (search = '') {
  const arr = search.split(/(\?|&)/)
  const parmsObj = {}

  for (let i = 0; i < arr.length; i++) {
    if (arr[i].indexOf('=') !== -1) {
      const keyValue = arr[i].match(/([^=]*)=(.*)/)
      parmsObj[keyValue[1]] = decodeURIComponent(keyValue[2])
    }
  }

  if (JSON.stringify(parmsObj) === '{}') {
    // 如果解析失败，返回原值
    return search
  }

  return parmsObj
}
