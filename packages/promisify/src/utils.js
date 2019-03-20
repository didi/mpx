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
    let myKey = updateOrRemoveOpt.hasOwnProperty(key) ? updateOrRemoveOpt[key] : key
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
 */
const handleSuccess = (opts, getOptions) => {
  if (!opts.success) {
    return
  }
  const cacheSuc = opts.success
  opts.success = res => {
    const changedRes = getOptions(res)
    cacheSuc(changedRes)
  }
}

function warn (msg) {
  console.warn(`mpx-promisify warn: ${msg}`)
}

function info (msg) {
  console.log(`mpx-promisify info: ${msg}`)
}

function noop () {}

export {
  changeOpts,
  handleSuccess,
  warn,
  info,
  noop
}
