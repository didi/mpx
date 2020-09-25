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
        ms.hooks.pullingDown.on(this.__mpxPullDownHandler)
      }

      // 页面滚动
      ms.useScroll()
      if (disableScroll) {
        ms.debounce = 0
      }
      if (this.onPageScroll || this.onReachBottom) {
        ms.hooks.scroll.on(this.__mpxPageScrollHandler)
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
    this.disposer = []
  }

  on (handler) {
    this.disposer.push(handler)
    return this
  }

  emit (...args) {
    this.disposer.forEach(handler => handler(...args))
    return this
  }

  destroy () {
    this.disposer = []
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

// --------------- ScrollAnimation

class ScrollAnimation {
  easeOutQuart (time, beginPosition, endPosition, callback) {
    const startTime = Date.now()
    const endTime = startTime + time
    const bounceFn = t => 1 - (--t) * t * t * t
    let timer = null
    const scheduler = () => {
      const now = Date.now()
      if (now >= endTime) {
        window.cancelAnimationFrame(timer)
        timer = null
        return
      }
      const ratio = bounceFn((now - startTime) / time)
      const currentPosition = ratio * (endPosition - beginPosition) + beginPosition
      callback(currentPosition)
      timer = window.requestAnimationFrame(scheduler)
    }
    scheduler()
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
      threshold: 90, // 滑动触发下拉刷新的距离
      stop: 40, // 下拉刷新时停留的位置距离屏幕顶部的距离
      bounceTime: 800 // 设置回弹动画的动画时长
    }
    this.options = Object.assign({}, defaultOptions, options)
    this.ratio = 0.5
    this.el = getElement(el)
    this.touchstartY = 0
    this.currentY = 0
    this.progress = this.el.children[0]
    this.isRefresh = false
    this.bottomReached = false

    const hooks = [
      'scroll', // 页面自然滚动
      'pageScrollTo', // 手动调用 pageScrollTo
      'move', // pull down 时 loading 移动
      'pullingDown' // pullDown 事件
    ]
    this.hooks = {}
    hooks.forEach(hook => {
      this.hooks[hook] = new EventEmitter()
    })
    this.eventRegister = new EventRegister()
    this.scrollAnimation = new ScrollAnimation()
  }

  usePullDownRefresh () {
    this.hooks.move.on((bounceTime, beginPosition, endPosition) => {
      this.scrollAnimation.easeOutQuart(bounceTime, beginPosition, endPosition, distance => {
        this.progress.style.height = distance + 'px'
      })
    })
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
      this.hooks.pullingDown.emit(true)
      this.isRefresh = true
      this.moveBack()
    } else if (distance > 0) {
      this.moveBack()
    }
  }

  moveBack () {
    const currentHeight = this.progress.offsetHeight
    const { stop, threshold, bounceTime } = this.options
    const finalDistance = currentHeight >= threshold
      ? stop
      : 0
    this.hooks.move.emit(bounceTime, currentHeight, finalDistance)
  }

  useScroll () {
    this.hooks.pageScrollTo.on((bounceTime, beginPosition, endPosition) => {
      this.scrollAnimation.easeOutQuart(bounceTime, beginPosition, endPosition, distance => {
        window.scrollTo(0, distance)
      })
    })
    this.eventRegister.on(document, 'scroll', e => {
      const scrollTop = window.pageYOffset
      this.scrollTop = scrollTop
      this.hooks.scroll.emit(scrollTop)
    })
  }

  destroy () {
    const hooks = this.hooks
    Object.keys(hooks).forEach(hook => {
      this.hooks[hook].destroy()
    })
    this.eventRegister.destroy()
  }

  startPullDownRefresh () {
    if (this.isRefresh) {
      return
    }

    this.hooks.pullingDown.emit()
    this.pageScrollTo({
      scrollTop: 0,
      duration: 0
    })

    this.isRefresh = true

    const { stop, bounceTime } = this.options
    this.hooks.move.emit(bounceTime, 0, stop)
  }

  stopPullDownRefresh () {
    if (!this.isRefresh) {
      return
    }
    const { stop, bounceTime } = this.options
    this.hooks.move.emit(bounceTime, stop, 0)
    this.isRefresh = false
  }

  pageScrollTo ({
    scrollTop,
    selector,
    duration = 300
  }) {
    let position = getScrollTop()
    let _scrollTop

    if (isDef(scrollTop)) {
      _scrollTop = scrollTop
    } else if (isDef(selector)) {
      _scrollTop = getOffsetTop(getElement(selector))
    } else {
      return error('[pageScrollTo error]: scrollTop and selector are not defined')
    }

    if (duration === 0) {
      return window.scrollTo(0, _scrollTop)
    }

    this.hooks.pageScrollTo.emit(duration, position, _scrollTop)
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
