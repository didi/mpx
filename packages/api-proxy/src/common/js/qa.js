
import { getType } from './utils'

function successHandler (res, success, complete) {
  success && getType(success) === 'Function' && success(res)
  complete && getType(complete) === 'Function' && complete(res)
}

function failHandler (err, fail, complete) {
  fail && getType(fail) === 'Function' && fail(err)
  complete && getType(complete) === 'Function' && complete(err)
}

export {
  successHandler,
  failHandler
}
