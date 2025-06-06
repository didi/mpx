import { successHandle, failHandle, getFocusedNavigation, envError } from '../../../common/js'
import { nextTick } from '../next-tick'
function setNavigationBarTitle (options = {}) {
  const { title = '', success, fail, complete } = options
  const navigation = getFocusedNavigation()
  if (!(navigation && navigation.setOptions)) {
    failHandle({ errMsg: 'setNavigationBarTitle:fail' }, fail, complete)
  } else {
    nextTick(() => {
      navigation.setPageConfig({
        navigationBarTitleText: title.trim()
      })
      successHandle({ errMsg: 'setNavigationBarTitle:ok' }, success, complete)
    })
  }
}

function setNavigationBarColor (options = {}) {
  const { frontColor = '', backgroundColor = '', success, fail, complete } = options
  const navigation = getFocusedNavigation()
  if (!(navigation && navigation.setOptions)) {
    failHandle({ errMsg: 'setNavigationBarColor:fail' }, fail, complete)
  } else {
    nextTick(() => {
      navigation.setPageConfig({
        navigationBarBackgroundColor: backgroundColor,
        navigationBarTextStyle: frontColor
      })
      successHandle({ errMsg: 'setNavigationBarColor:ok' }, success, complete)
    })
  }
}

const hideHomeButton = envError('hideHomeButton')

export {
  setNavigationBarTitle,
  setNavigationBarColor,
  hideHomeButton
}
