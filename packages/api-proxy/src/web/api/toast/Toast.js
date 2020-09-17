import { webHandleSuccess } from '../../../common/js'
import '../../../common/stylus/Toast.styl'

function createDom (tag, attrs = {}, children = []) {
  let dom = document.createElement(tag)
  Object.keys(attrs).forEach(k => dom.setAttribute(k, attrs[k]))
  children.length && children.forEach(child => dom.appendChild(child))
  return dom
}

export default class Toast {
  constructor () {
    this.defaultOpts = {
      title: '',
      icon: 'success',
      image: '',
      duration: 2000,
      mask: false,
      success: (...args) => {},
      fail: (...args) => {},
      complete: (...args) => {}
    }
    this.hideTimer = null
    this.type = null

    this.toast = createDom('div', { class: '__mpx_toast__' }, [
      this.mask = createDom('div', { class: '__mpx_mask__' }),
      createDom('div', { class: '__mpx_toast_box__' }, [
        this.icon = createDom('div', { class: '__mpx_toast_icon__' }),
        this.title = createDom('div', { class: '__mpx_toast_title__' })
      ])
    ])

    document.body.appendChild(this.toast)
  }

  show (options, type) {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer)
      this.hideTimer = null
    }

    const opts = Object.assign({}, this.defaultOpts, options)

    this.type = type

    if (opts.mask) {
      this.mask.classList.add('show')
    } else {
      this.mask.classList.remove('show')
    }

    const defaultIconClass = '__mpx_toast_icon__'
    const iconClass = opts.image
      ? '' // image
      : opts.icon === 'loading'
        ? 'loading' // loading
        : opts.icon === 'none'
          ? 'hide' // none
          : 'success' // default

    this.icon.classList = `${iconClass} ${defaultIconClass}`
    this.icon.style.cssText = opts.image && `background-image: url(${opts.image})`

    this.title.textContent = opts.title || ''
    this.toast.classList.add('show')

    opts.duration >= 0 && this.hide({ duration: opts.duration }, type)

    const errMsg = type === 'loading' ? 'showLoading:ok' : 'showToast:ok'
    webHandleSuccess({ errMsg }, opts.success, opts.complete)
    return Promise.resolve({ errMsg })
  }

  hide (options = {}, type) {
    if (this.type !== type) return

    const duration = options.duration || 0
    const errMsg = type === 'loading' ? 'hideLoading:ok' : 'hideToast:ok'
    webHandleSuccess({ errMsg }, options.success, options.complete)

    if (this.hideTimer) {
      clearTimeout(this.hideTimer)
      this.hideTimer = null
    }

    this.hideTimer = setTimeout(() => { this.toast.classList.remove('show') }, duration)
    return Promise.resolve({ errMsg })
  }
}
