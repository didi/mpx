import { successHandle } from '../../../common/js'
import '../../../common/stylus/Toast.styl'

import { getClassStyle } from '@hummer/tenon-vue'

function createDom (Element, attrs = {}, children = []) {
  const dom = new Element()
  Object.keys(attrs).forEach(k => Reflect.set(dom, k, attrs[k]))
  children.length && children.forEach(child => dom.appendChild(child))
  return dom
}

export default class Toast {
  constructor () {
    this.defaultOpts = {
      title: '',
      icon: 'success',
      image: '',
      duration: 1500,
      mask: false,
      success: () => {},
      fail: () => {},
      complete: () => {}
    }
    this.dialog = null
    this.hideTimer = null
    this.type = null

    // create & combine toast
    this.toast = createDom(View, { style: getClassStyle(null, '__mpx_toast__') }, [
      // todo 暂不支持 mask隐藏
      // this.mask = createDom(View, { style: getClassStyle(null, '__mpx_mask__') }),
      this.content = createDom(View, { style: getClassStyle(null, '__mpx_toast_box__') }, [
        this.icon = createDom(View, { style: getClassStyle(null, '__mpx_toast_icon__') }),
        this.title = createDom(Text, { style: getClassStyle(null, '__mpx_toast_title__') })
      ])
    ])
  }

  show (options, type) {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer)
      this.hideTimer = null
    }

    const opts = Object.assign({}, this.defaultOpts, options)

    this.type = type

    // if (opts.mask) {
    //   this.mask.class += 'show'
    // } else {
    //   this.mask.classList.remove('show')
    // }

    // const defaultIconClass = '__mpx_toast_icon__'

    const iconClass = opts.image
      ? '' // image
      : opts.icon === 'none'
        ? '__hide_icon' // none
        : opts.icon === 'error'
          ? '__error_icon'
          : '__success_icon' // default

    // 在Hummer环境，Object.assign 有一些问题，需要重新进行一次赋值
    this.icon.style = Object.assign(this.icon.style, getClassStyle(null, `${iconClass}`))

    opts.image && (this.icon.style = Object.assign(this.icon.style, { backgroundImage: opts.image }))

    this.title.text = opts.title || ''

    this.dialog = new Dialog()
    this.dialog.cancelable = false
    opts.icon === 'loading'
      ? this.dialog.loading(opts.title || 'loading...') // 空字符串也被过滤
      : this.dialog.custom(this.toast)

    opts.duration >= 0 && this.hide({ duration: opts.duration }, type)

    const errMsg = type === 'loading' ? 'showLoading:ok' : 'showToast:ok'
    successHandle({ errMsg }, opts.success, opts.complete)
    return Promise.resolve({ errMsg })
  }

  hide (options = {}, type) {
    if (this.type !== type) return

    const duration = options.duration || 0
    const errMsg = type === 'loading' ? 'hideLoading:ok' : 'hideToast:ok'
    successHandle({ errMsg }, options.success, options.complete)

    if (this.hideTimer) {
      clearTimeout(this.hideTimer)
      this.hideTimer = null
    }

    this.hideTimer = setTimeout(() => { this.dialog.dismiss() }, duration)
    return Promise.resolve({ errMsg })
  }
}
