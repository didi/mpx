
import { getType } from './utils'

function successHandler(res, success, complete) {
  success && getType(success) === 'function' && success(res)
  complete && getType(complete) === 'function' && complete(res)
}

function failHandler(err, fail, complete) {
  fail && getType(fail) === 'function' && fail(err)
  complete && getType(complete) === 'function' && complete(err)
}

export {
  successHandler,
  failHandler
}