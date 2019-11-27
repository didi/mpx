import { webHandleSuccess } from '../../common/js'

function setNavigationBarTitle (options = {}) {
  const { title, success, complete } = options

  if (document.title !== title) {
    document.title = title
  }

  webHandleSuccess({ errMsg: 'setNavigationBarTitle:ok' }, success, complete)
}

function setNavigationBarColor (options = {}) {
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
