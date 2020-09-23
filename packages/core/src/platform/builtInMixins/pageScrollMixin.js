import { error } from '../../helper/log'

let ms

function refreshMs (vm) {
  if (ms) ms.destroy()
  try {
    window.__ms = ms = new MpxScroll(vm.$el)
    return true
  } catch (e) {
    const location = vm.__mpxProxy && vm.__mpxProxy.options.mpxFileResource
    error(`MpxScroll init error, please check.`, location, e)
  }
}

let loading = null

function showLoading (vm) {
  const { backgroundColor = '#fff', backgroundTextStyle = 'dark' } = vm.$options.__mpxPageConfig
  loading = document.createElement('div')
  loading.className = 'pull-down-loading'
  loading.style.cssText = `background-color: ${backgroundColor}; height: 0`
  const dot = document.createElement('div')
  dot.className = `dot-flashing ${backgroundTextStyle}`
  loading.append(dot)
  vm.$el.prepend(loading)
}

function hideLoading (vm) {
  if (loading) {
    vm.$el.removeChild(loading)
    loading = null
  }
}

export default function pageScrollMixin (mixinType) {
  if (mixinType !== 'page') {
    return
  }
  return {
    mounted () {
      this.__lastScrollY = 0
    },
    activated () {
      showLoading(this)

      if (!refreshMs(this)) {
        return
      }

      ms.pageScrollTo({
        scrollTop: this.__lastScrollY,
        duration: 0
      })

      const { disableScroll, enablePullDownRefresh } = this.$options.__mpxPageConfig

      // 下拉刷新
      if (enablePullDownRefresh) {
        ms.usePullDownRefresh()
        ms.hooks.on('pullingDown', this.__mpxPullDownHandler)
      }

      // 页面滚动
      ms.useScroll()
      if (disableScroll) {
        ms.debounce = 0
      }
      if (this.onPageScroll || this.onReachBottom) {
        ms.hooks.on('scroll', this.__mpxPageScrollHandler)
      }
    },
    deactivated () {
      if (ms) {
        this.__lastScrollY = getScrollTop()
        ms.destroy()
        hideLoading(this)
      }
    },
    beforeDestroy () {
      if (ms) {
        ms.destroy()
        hideLoading(this)
      }
    },
    methods: {
      __mpxPullDownHandler (autoStop = false) {
        this.__pullingDown = true
        // 同微信保持一致
        // 如果是手动触摸下拉，3s 后用户还没有调用过 __stopPullDownRefresh，则自动调用关闭 pullDown
        // 如果是手动调用 startPullDownRefresh 的 api，则一直处于 pull down 状态
        if (autoStop) {
          setTimeout(() => {
            if (this.__pullingDown) {
              this.__stopPullDownRefresh()
            }
          }, 3000)
        }
        this.onPullDownRefresh && this.onPullDownRefresh()
      },
      __stopPullDownRefresh () {
        this.__pullingDown = false
        if (this.$options.__mpxPageConfig.enablePullDownRefresh && ms) {
          ms.stopPullDownRefresh()
        }
      },
      __startPullDownRefresh () {
        if (!this.__pullingDown && this.$options.__mpxPageConfig.enablePullDownRefresh && ms) {
          ms.startPullDownRefresh()
        }
      },
      __mpxPageScrollHandler (scrollTop) {
        const { disableScroll, onReachBottomDistance = 50 } = this.$options.__mpxPageConfig

        // 直接通过 css 或 preventDefault 禁止页面滚动时，下拉刷新也会失效
        // 所以采用这种方式实现禁止页面滚动
        if (disableScroll) {
          return ms.pageScrollTo({
            scrollTop: 0,
            duration: 0
          })
        }

        if (this.onPageScroll) {
          this.onPageScroll({ scrollTop })
        }

        if (this.onReachBottom) {
          ms.onReachBottom(onReachBottomDistance, this.onReachBottom)
        }
      }
    }
  }
}

// --------------- dom

function addEvent (el, type, handler) {
  el.addEventListener(type, handler, { passive: false })
}

function removeEvent (el, type, handler) {
  el.removeEventListener(type, handler, { passive: false })
}

function getScrollTop () {
  return document.documentElement.scrollTop || window.pageYOffset || document.body.scrollTop
}

function preventDefault (e, isStopPropagation) {
  if (typeof e.cancelable !== 'boolean' || e.cancelable) {
    e.preventDefault()
  }

  if (isStopPropagation) {
    e.stopPropagation()
  }
}

// --------------- EventEmitter

class EventEmitter {
  constructor () {
    this.events = {}
  }

  on (type, handler) {
    if (!this.events[type]) {
      this.events[type] = []
    }
    this.events[type].push(handler)
    return this
  }

  emit (type, ...args) {
    if (this.events[type]) {
      this.events[type].forEach(handler => handler(...args))
    }
    return this
  }

  destroy () {
    this.events = {}
    return this
  }
}

// --------------- EventRegister

class EventRegister {
  constructor () {
    this.disposer = []
  }

  on (el, type, handler) {
    this.disposer.push([el, type, handler])
    addEvent(el, type, handler)
  }

  destroy () {
    this.disposer.forEach(args => {
      removeEvent(args[0], args[1], args[2])
    })
    this.disposer = []
  }
}

// --------------- MpxScroll

function isDef (val) {
  return val !== undefined
}

function getOffsetTop (el) {
  let top = el.offsetTop
  let op = el.offsetParent
  while (op) {
    top += op.offsetTop
    op = op.offsetParent
  }
  return top
}

function getElement (el) {
  return typeof el === 'string'
    ? document.querySelector(el)
    : el
}

export class MpxScroll {
  constructor (el, options = {}) {
    const defaultOptions = {
      threshold: 100, // 滑动触发下拉刷新的距离
      stop: 60 // 下拉刷新时停留的位置距离屏幕顶部的距离
    }
    this.ratio = 1
    this.el = getElement(el)
    this.options = Object.assign({}, defaultOptions, options)
    this.touchstartY = 0
    this.currentY = 0
    this.progress = this.el.children[0]
    this.isRefresh = false
    this.bottomReached = false
    this.hooks = new EventEmitter()
    this.eventRegister = new EventRegister()
  }

  usePullDownRefresh () {
    this.eventRegister.on(this.el, 'touchstart', e => this.onTouchStart(e))
    this.eventRegister.on(this.el, 'touchmove', e => this.onTouchMove(e))
    this.eventRegister.on(this.el, 'touchend', e => this.onTouchEnd(e))
  }

  onTouchStart (e) {
    this.touchstartY = e.changedTouches[0].clientY
  }

  onTouchMove (e) {
    const scrollTop = getScrollTop()
    this.currentY = e.targetTouches[0].clientY
    if (this.currentY - this.touchstartY >= 0 && scrollTop <= 0) {
      preventDefault(e)
      if (!this.isRefresh) {
        this.pullDown(this.currentY - this.touchstartY)
      }
    }
  }

  pullDown (distance) {
    let alteredDistance
    if (distance * this.ratio < this.options.threshold) {
      alteredDistance = distance
    } else {
      alteredDistance = this.options.threshold + (distance - this.options.threshold)
    }
    this.progress.style.height = alteredDistance * this.ratio + 'px'
  }

  onTouchEnd (e) {
    const scrollTop = getScrollTop()

    if (scrollTop > 0 || this.isRefresh) {
      return
    }

    const distance = this.currentY - this.touchstartY
    if (distance * this.ratio >= this.options.threshold) {
      this.hooks.emit('pullingDown', true)
      this.isRefresh = true
      this.moveBack()
    } else if (distance > 0) {
      this.moveBack()
    }
  }

  moveBack () {
    const currentHeight = this.progress.offsetHeight
    const { stop, threshold } = this.options
    const finalDistance = currentHeight >= threshold ? stop : 0
    this.progress.style.height = finalDistance + 'px'
  }

  useScroll () {
    this.eventRegister.on(document, 'scroll', e => {
      const scrollTop = window.pageYOffset
      this.scrollTop = scrollTop
      this.hooks.emit('scroll', scrollTop)
    })
  }

  destroy () {
    this.hooks.destroy()
    this.eventRegister.destroy()
  }

  startPullDownRefresh () {
    if (this.isRefresh) {
      return
    }

    this.hooks.emit('pullingDown')
    this.pageScrollTo({
      scrollTop: 0,
      duration: 0
    })

    this.isRefresh = true

    const stop = this.options.stop
    const step = stop / 16
    let currentHeight = 0

    const next = () => {
      window.requestAnimationFrame(() => {
        currentHeight += step
        if (currentHeight < stop) {
          this.progress.style.height = currentHeight + 'px'
          next()
        } else {
          this.progress.style.height = stop + 'px'
        }
      })
    }
    next()
  }

  stopPullDownRefresh () {
    if (!this.isRefresh) {
      return
    }
    let currentHeight = this.options.stop
    const step = currentHeight / 16
    const next = () => {
      window.requestAnimationFrame(() => {
        currentHeight -= step
        if (currentHeight <= 0) {
          this.progress.style.height = 0 + 'px'
          this.isRefresh = false
        } else {
          this.progress.style.height = currentHeight + 'px'
          next()
        }
      })
    }
    next()
  }

  pageScrollTo ({
    scrollTop,
    selector,
    duration = 300
  }) {
    const speed = duration / 16
    let position = getScrollTop()
    let _scrollTop

    if (isDef(scrollTop)) {
      _scrollTop = scrollTop
    } else if (isDef(selector)) {
      _scrollTop = getOffsetTop(getElement(selector))
    }

    if (duration === 0) {
      return window.scrollTo(0, _scrollTop)
    }

    const step = Math.floor(Math.abs(position - _scrollTop) / speed)

    const next = (() => {
      // fix eslint
      const requestAnimationFrame = window.requestAnimationFrame
      if (position < _scrollTop) {
        return () => {
          requestAnimationFrame(() => {
            position += step
            if (position <= _scrollTop) {
              window.scrollTo(0, position)
              next()
            } else {
              window.scrollTo(0, _scrollTop)
            }
          })
        }
      } else {
        return () => {
          requestAnimationFrame(() => {
            position -= step
            if (position >= _scrollTop) {
              window.scrollTo(0, position)
              next()
            } else {
              window.scrollTo(0, _scrollTop)
            }
          })
        }
      }
    })()

    next()
  }

  onReachBottom (onReachBottomDistance, callback) {
    const { bottom } = this.el.getBoundingClientRect()
    const mark = bottom - window.innerHeight <= onReachBottomDistance

    if (!this.bottomReached && mark) {
      this.bottomReached = true
      callback()
    } else if (!mark) {
      this.bottomReached = false
    }
  }
}
