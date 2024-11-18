import { hasOwn, noop, getEnvObj, getFocusedNavigation } from '@mpxjs/utils'

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

function genFromMap () {
  const result = {}
  const platforms = ['wx', 'ali', 'swan', 'qq', 'tt', 'web', 'tenon', 'qa', 'jd', 'dd']
  platforms.forEach((platform) => {
    result[`__mpx_src_mode_${platform}__`] = platform
  })
  return result
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
    throw Error(`[@mpxjs/api-proxy error]:\n ${__mpx_mode__}环境不支持${method}方法`)
  }
}

function defineUnsupportedProps (resObj, props) {
  const defineProps = {}
  props.forEach((item) => {
    defineProps[item] = {
      get () {
        warn(`The ${item} attribute is not supported in ${__mpx_mode__} environment`)
        return null
      }
    }
  })
  Object.defineProperties(resObj, defineProps)
}

const isBrowser = typeof window !== 'undefined'

function throwSSRWarning (info) {
  console.error(`[Mpx runtime error]: Dangerous API! ${info}, It may cause some problems, please use this method with caution`)
}

function successHandle (result, success, complete) {
  typeof success === 'function' && success(result)
  typeof complete === 'function' && complete(result)
}

function failHandle (result, fail, complete) {
  typeof fail === 'function' && fail(result)
  typeof complete === 'function' && complete(result)
}

const ENV_OBJ = getEnvObj()

export {
  changeOpts,
  handleSuccess,
  error,
  envError,
  warn,
  isBrowser,
  throwSSRWarning,
  ENV_OBJ,
  defineUnsupportedProps,
  successHandle,
  failHandle,
  getFocusedNavigation
}
