import '../../common/stylus/interactive.styl'

const noop = () => {}
export default class Toast {
  constructor () {
    this.defaultOpts = {
      title: '',
      icon: 'none',
      image: '',
      duration: 2000,
      mask: false,
      success: noop,
      fail: noop,
      complete: noop
    }

    const toast = document.createElement('div')
    toast.setAttribute('class', '__mpx_toast__')

    const mask = document.createElement('div')
    mask.setAttribute('class', '__mpx_mask__')

    const box = document.createElement('div')
    box.setAttribute('class', '__mpx_toast_box__')

    const icon = document.createElement('p')
    icon.setAttribute('class', '__mpx_toast_icon__')

    const title = document.createElement('p')
    title.setAttribute('class', '__mpx_toast_title__')

    box.appendChild(icon)
    box.appendChild(title)
    toast.appendChild(mask)
    toast.appendChild(box)
    document.body.appendChild(toast)

    this.toast = toast
    this.mask = mask
    this.box = box
    this.icon = icon
    this.title = title
  }

  show (options = {}, type) {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer)
      this.hideTimer = null
    }

    const opts = { ...this.defaultOpts, ...options }

    this.type = type

    if (opts.mask) {
      this.mask.classList.add('show')
    } else {
      this.mask.classList.remove('show')
    }

    if (opts.icon === 'none') {
      this.box.classList.add('no-icon')
    } else {
      this.box.classList.remove('no-icon')
    }

    if (opts.image) {
      this.icon.classList.remove('success', 'loading')
    } else if (opts.icon === 'loading') {
      this.icon.classList.add('loading')
      this.icon.classList.remove('success')
    } else if (opts.icon === 'success') {
      this.icon.classList.add('success')
      this.icon.classList.remove('loading')
    } else if (opts.icon === 'none') {
      this.icon.classList.add('hide')
    }

    this.title.textContent = opts.title || ''
    this.toast.classList.add('show')

    opts.duration >= 0 && this.hide(null, opts.duration, type)

    const errMsg = type === 'loading' ? 'showLoading:ok' : 'showToast:ok'
    opts.success && opts.success({ errMsg })
    opts.complete && opts.complete({ errMsg })
  }

  hide (options, duration = 0, type) {
    if (this.type !== type) return

    const errMsg = type === 'loading' ? 'hideLoading:ok' : 'hideToast:ok'
    options && options.success && options.success({ errMsg })
    options && options.complete && options.complete({ errMsg })

    if (this.hideTimer) { return }

    this.hideTimer = setTimeout(() => { this.toast.classList.remove('show') }, duration)
  }
}
