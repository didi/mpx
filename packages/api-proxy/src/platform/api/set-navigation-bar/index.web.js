import { isBrowser, throwSSRWarning, webHandleSuccess } from '../../../common/js'

function setNavigationBarTitle (options = {}) {
  if (!isBrowser) {
    throwSSRWarning('setNavigationBarTitle API is running in non browser environments')
    return
  }
  const { title, success, complete } = options
  if (document.title !== title) {
    document.title = title
  }

  webHandleSuccess({ errMsg: 'setNavigationBarTitle:ok' }, success, complete)
}

function setNavigationBarColor (options = {}) {
  if (!isBrowser) {
    throwSSRWarning('setNavigationBarColor API is running in non browser environments')
    return
  }
  const { backgroundColor, success, complete } = options
  const meta = document.createElement('meta')
  meta.setAttribute('name', 'theme-color')
  meta.setAttribute('content', backgroundColor)
  document.head.appendChild(meta)
  webHandleSuccess({ errMsg: 'setNavigationBarColor:ok' }, success, complete)
}

export {
  setNavigationBarTitle,
  setNavigationBarColor
}
