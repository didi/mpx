import { successHandle, failHandle, getFocusedNavigation } from '../../../common/js'

/**
 * 实现 React Native 下的 pageScrollTo
 * 支持 scrollTop 和 selector 两种定位方式
 */
export function pageScrollTo (options = {}) {
  const {
    scrollTop,
    duration = 300,
    selector,
    offsetTop = 0,
    success,
    fail,
    complete
  } = options

  const navigation = getFocusedNavigation()

  if (!navigation?.pageScrollTo) {
    return failHandle({
      errMsg: 'pageScrollTo:fail page instance not found'
    }, fail, complete)
  }

  // 验证参数
  if (scrollTop === undefined && !selector) {
    return failHandle({
      errMsg: 'pageScrollTo:fail scrollTop or selector is required'
    }, fail, complete)
  }

  try {
    navigation.pageScrollTo({
      scrollTop,
      duration,
      selector,
      offsetTop,
      onSuccess: () => {
        successHandle({
          errMsg: 'pageScrollTo:ok'
        }, success, complete)
      },
      onFail: (errMsg) => {
        failHandle({
          errMsg: errMsg || 'pageScrollTo:fail'
        }, fail, complete)
      }
    })
  } catch (e) {
    failHandle({
      errMsg: `pageScrollTo:fail ${e.message}`
    }, fail, complete)
  }
}
