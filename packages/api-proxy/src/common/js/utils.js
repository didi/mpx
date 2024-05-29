/**
 *
 * @param {Object} options 原参数
 * @param {Object} updateOrRemoveOpt 要修改或者删除的参数
 * @param {Object} extraOpt 额外增加的参数
 * @returns {Object} 返回参数
 * @example
 * changeOpts({ a: 1, b: 2 }, {
 *  a: 'c', // a 变为 c
 *  b: '' // 删除 b
 * }, {
 *  d: 4 // 增加 d
 * })
 */
const hasOwnProperty = Object.prototype.hasOwnProperty

function hasOwn (obj, key) {
  return hasOwnProperty.call(obj, key)
}

function changeOpts (options, updateOrRemoveOpt = {}, extraOpt = {}) {
  let opts = {}

  Object.keys(options).forEach(key => {
    const myKey = hasOwn(updateOrRemoveOpt, key) ? updateOrRemoveOpt[key] : key
    if (myKey !== '') {
      opts[myKey] = options[key]
    }
  })

  opts = Object.assign({}, opts, extraOpt)
  return opts
}

/**
 * @param {Object} opts 原参数
 * @param {Function} getOptions 获取 success 回调修改后的参数
 * @param {Object} thisObj this对象
 */
const handleSuccess = (opts, getOptions = noop, thisObj) => {
  if (!opts.success) {
    return
  }
  const _this = thisObj || this
  const cacheSuc = opts.success
  opts.success = res => {
    const changedRes = getOptions(res) || res
    cacheSuc.call(_this, changedRes)
  }
}

function getEnvObj () {
  switch (__mpx_mode__) {
    case 'wx':
      return wx
    case 'ali':
      return my
    case 'swan':
      return swan
    case 'qq':
      return qq
    case 'tt':
      return tt
    case 'jd':
      return jd
    case 'qa':
      return qa
    case 'dd':
      return dd
    case 'web':
      return {}
  }
}

function warn (msg) {
  console.warn && console.warn(`[@mpxjs/api-proxy warn]:\n ${msg}`)
}

function error (msg) {
  console.error && console.error(`[@mpxjs/api-proxy error]:\n ${msg}`)
}
function envError (method) {
  return () => {
    console.error && console.error(`[@mpxjs/api-proxy error]:\n ${__mpx_mode__}环境不支持${method}方法`)
  }
}

function noop () {
}

function makeMap (arr) {
  return arr.reduce((obj, item) => {
    obj[item] = true
    return obj
  }, {})
}

const isBrowser = typeof window !== 'undefined'

function throwSSRWarning (info) {
  console.error(`[Mpx runtime error]: Dangerous API! ${info}, It may cause some problems, please use this method with caution`)
}

const ENV_OBJ = getEnvObj()

export {
  changeOpts,
  handleSuccess,
  getEnvObj,
  error,
  envError,
  warn,
  noop,
  makeMap,
  isBrowser,
  hasOwn,
  throwSSRWarning,
  ENV_OBJ
}
