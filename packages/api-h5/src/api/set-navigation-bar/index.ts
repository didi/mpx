import { handleSuccess, handleFail } from '../../common/ts/utils'

function setNavigationBarTitle (options: WechatMiniprogram.SetNavigationBarTitleOption = { title: '' }) {
  const { title, success, complete } = options

  if (document.title !== title) {
    document.title = title
  }

  handleSuccess({ errMsg: 'setNavigationBarTitle:ok' }, success, complete)
}

function setNavigationBarColor (options: WechatMiniprogram.SetNavigationBarColorOption = { frontColor: '', backgroundColor: '' }) {
  const { backgroundColor, success, complete } = options
  const meta = document.createElement('meta')
  meta.setAttribute('name', 'theme-color')
  meta.setAttribute('content', backgroundColor)
  document.head.appendChild(meta)
  handleSuccess({ errMsg: 'setNavigationBarColor:ok' }, success, complete)
}

export {
  setNavigationBarTitle,
  setNavigationBarColor
}
