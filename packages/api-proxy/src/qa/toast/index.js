import qPrompt from 'qPrompt'
import {
  successHandler,
  failHandler,
  assignHandler,
  error
} from '../../common/js'

function showToast ({
  title = '',
  duration = 0,
  success,
  fail,
  complete
}) {
  try {
    qPrompt.showToast({
      message: title,
      duration
    })
    const result = Object.assign({
      msg: 'showToast:ok'
    })
    successHandler(result, success, complete)
  } catch (error) {
    failHandler(error, fail, complete)
  }
}

function hideToast (options = {}) {
  let err = 'hideToast is not supported in quickApp environment! '
  error(err)
}

function showModal (options = {}) {
  const {
    title,
    content,
    cancelText,
    cancelColor,
    confirmText,
    confirmColor,
    success,
    fail,
    complete
  } = options
  let buttonArr = Array.of({
    text: confirmText || '确定',
    color: confirmColor || '#576B95'
  }, {
    text: cancelText || '取消',
    color: cancelColor || '#000000'
  })
  const handlerObj = assignHandler(success, fail, complete)
  const successResult = function () {
    let paramsObj = {
      confirm: arguments[0].index === '0',
      cancel: arguments[0].index === '1',
      index: arguments[0].index
    }
    return handlerObj.success.call(this, paramsObj)
  }
  qPrompt.showDialog(Object.assign({
    title: title || '',
    message: content,
    buttons: buttonArr
  }, assignHandler(success, fail, complete), {
    success: successResult
  }))
}
export {
  showToast,
  hideToast,
  showModal
}
