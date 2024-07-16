import { successHandle, failHandle } from '../../../common/js'
import { noop } from '@mpxjs/utils'

function getFocusedNavigation () {
  for (const key in global.__mpxPagesMap) {
    const navigation = global.__mpxPagesMap[key]?.[1]
    console.log(navigation, navigation?.isFocused)
    if (navigation && navigation.isFocused()) {
      return navigation
    }
  }
}
function setNavigationBarTitle (options = {}) {
  const { title = '', success = noop, fail = noop, complete = noop } = options
  const navigation = getFocusedNavigation()
  if (!navigation?.setOptions) {
    failHandle({ errMsg: 'setNavigationBarTitle:fail' }, fail, complete)
  } else {
    navigation.setOptions({ headerTitle: title })
    successHandle({ errMsg: 'setNavigationBarTitle:ok' }, success, complete)
  }
}

function setNavigationBarColor (options = {}) {
  const { frontColor = '', backgroundColor = '', success = noop, fail = noop, complete = noop } = options
  const navigation = getFocusedNavigation()
  if (!navigation?.setOptions) {
    failHandle({ errMsg: 'setNavigationBarColor:fail' }, fail, complete)
  } else {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: backgroundColor
      },
      headerTintColor: frontColor
    })
    successHandle({ errMsg: 'setNavigationBarColor:ok' }, success, complete)
  }
}

export {
  setNavigationBarTitle,
  setNavigationBarColor
}
