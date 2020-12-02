/* eslint-disable no-useless-call */
import {
  getType
} from './utils'

function successHandler (res, success, complete) {
  success && getType(success) === 'Function' && success(res)
  complete && getType(complete) === 'Function' && complete(res)
}

function failHandler (err, fail, complete) {
  fail && getType(fail) === 'Function' && fail(err)
  complete && getType(complete) === 'Function' && complete(err)
}

function assignHandler (success, fail, complete) {
  return Object.assign({}, {
    success: function () {
      success && typeof success === 'function' && success.call(null, ...arguments)
    },
    fail: function () {
      fail && typeof fail === 'function' && fail.call(null, ...arguments)
    },
    complete: function () {
      complete && typeof complete === 'function' && complete.call(null, ...arguments)
    }
  })
}
function urlHandler (url = '') {
  const arr = url.split(/\?|&/)
  let link = arr[0]; let paramsArr = arr.slice(1)
  const resultObj = paramsArr.reduce((prev, curr) => {
    const tempArr = curr.split('=')
    prev[tempArr[0]] = tempArr[1] || true
    return prev
  }, {})
  return {
    link,
    params: resultObj
  }
}
export {
  successHandler,
  failHandler,
  assignHandler,
  urlHandler
}
