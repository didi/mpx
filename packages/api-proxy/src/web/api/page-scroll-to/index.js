import { webHandleSuccess, webHandleFail } from '../../../common/js'
import { nextTick } from '../next-tick'

function isDef (val) {
  return val !== undefined
}

export function pageScrollTo ({
  scrollTop,
  selector,
  duration = 300,
  success,
  fail,
  complete
}) {
  nextTick(() => {
    const bs = window.__mpxBs

    if (!bs) {
      return webHandleFail({
        errMsg: 'pageScrollTo:fail'
      }, fail, complete)
    }

    const callback = () => {
      webHandleSuccess({
        errMsg: 'pageScrollTo:ok'
      }, success, complete)
    }
    // scrollTop 比 selector 的优先级高
    if (isDef(scrollTop)) {
      // better scroll 的 scrollTop 与微信的 scrollTop 相反
      bs.scrollTo(0, -scrollTop, duration)
      callback()
    } else if (isDef(selector)) {
      bs.scrollToElement(selector, duration)
      callback()
    }
  })
}
