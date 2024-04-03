import { webHandleSuccess } from '../../../common/js'
const {
  Hummer
} = __GLOBAL__

function setNavigationBarTitle (options = {}) {
  const { title, success, complete } = options
  Hummer.setTitle(title)
  webHandleSuccess({ errMsg: 'setTitle:ok' }, success, complete)
}

function setNavigationBarColor (options = {}) {}

export {
  setNavigationBarTitle,
  setNavigationBarColor
}
