import { successHandle, createDom, getRootElement } from '../../../common/js'
import '../../../common/stylus/Toast.styl'
import '../../../common/stylus/Loading.styl'

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
    this.hideTimer = null
    this.type = null

    // create & combine toast
    this.toast = createDom('div', { class: '__mpx_toast__' }, [
      this.mask = createDom('div', { class: '__mpx_mask__' }),
      this.content = createDom('div', { class: '__mpx_toast_box__' }, [
        this.icon = createDom('div', { class: '__mpx_toast_icon__' }),
        this.title = createDom('div', { class: '__mpx_toast_title__' })
      ])
    ])

    // loading animation dom
    this.loading = createDom('div', { class: '__mpx_loading_wrapper__' }, Array.from({ length: 12 }, (_, i) => {
      return createDom('div', { class: `line${i + 1}` })
    }))
  }

  show (options, type) {
    getRootElement().appendChild(this.toast) // show 则挂载
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

    if (opts.icon === 'loading') {
      this.icon.parentNode && this.content.replaceChild(this.loading, this.icon) // if loading, replace with loading dom
    } else {
      this.loading.parentNode && this.content.replaceChild(this.icon, this.loading) // set icon to default

      const defaultIconClass = '__mpx_toast_icon__'

      const iconClass = opts.image
        ? '' // image
        : opts.icon === 'none'
          ? 'hide' // none
          : opts.icon === 'error'
            ? 'error'
            : 'success' // default

      this.icon.className = `${iconClass} ${defaultIconClass}`
      this.icon.style.cssText = opts.image && `background-image: url(${opts.image})`
    }

    this.title.textContent = opts.title || ''

    this.toast.classList.add('show')
    opts.duration >= 0 && this.hide({ duration: opts.duration }, type)

    const errMsg = type === 'loading' ? 'showLoading:ok' : 'showToast:ok'
    successHandle({ errMsg }, opts.success, opts.complete)
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
    this.hideTimer = setTimeout(() => {
      this.toast.classList.remove('show')
      this.toast.remove() // hide 则卸载
    }, duration)
  }
}
