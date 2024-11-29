import { successHandle } from '../../../common/js'
const {
  Hummer
} = __GLOBAL__

function setNavigationBarTitle (options = {}) {
  const { title, success, complete } = options
  Hummer.setTitle(title)
  successHandle({ errMsg: 'setTitle:ok' }, success, complete)
}

function setNavigationBarColor (options = {}) {}

export {
  setNavigationBarTitle,
  setNavigationBarColor
}
