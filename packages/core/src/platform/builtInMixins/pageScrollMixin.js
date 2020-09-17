import { error } from '../../helper/log'

let ms

function refreshMs (vm) {
  if (ms) ms.destroy()
  try {
    window.__ms = ms = new MpxScroll(vm.$el, {
      pullDownRefresh: {
        threshold: 60
      }
    })
    return true
  } catch (e) {
    const location = vm.__mpxProxy && vm.__mpxProxy.options.mpxFileResource
    error(`MpxScroll init error, please check.`, location, e)
  }
}

function showLoading (vm) {
  const { backgroundColor = '#fff', backgroundTextStyle = 'dark' } = vm.$options.__mpxPageConfig
  const loading = document.createElement('div')
  loading.className = 'pull-down-loading'
  loading.style.backgroundColor = backgroundColor
  const dot = document.createElement('div')
  dot.className = `dot-flashing ${backgroundTextStyle}`
  loading.append(dot)
  vm.$el.prepend(loading)
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
      if (!refreshMs(this)) {
        return
      }
      ms.pageScrollTo({
        scrollTop: this.__lastScrollY
      })
      const { disableScroll, enablePullDownRefresh } = this.$options.__mpxPageConfig
      // 下拉刷新
      if (enablePullDownRefresh) {
        ms.enablePullDownRefresh()
        showLoading(this)
        ms.hooks.on('pullingDown', this.__mpxPullDownHandler)
      }
      // 页面滚动
      ms.enableScroll()
      if (disableScroll) {
        ms.debounce = 0
      }
      if (this.onPageScroll || this.onReachBottom) {
        ms.hooks.on('scroll', this.__mpxPageScrollHandler)
      }
    },
    deactivated () {
      if (ms) {
        this.__lastScrollY = ms.scrollTop
        ms.destroy()
      }
    },
    beforeDestroy () {
      if (ms) {
        ms.destroy()
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

const MIN_DISTANCE = 60

function getDirection (x, y) {
  if (x > y && x > MIN_DISTANCE) {
    return 'horizontal'
  }

  if (y > x && y > MIN_DISTANCE) {
    return 'vertical'
  }

  return ''
}

function preventDefault (e, isStopPropagation) {
  if (typeof e.cancelable !== 'boolean' || e.cancelable) {
    e.preventDefault()
  }

  if (isStopPropagation) {
    e.stopPropagation()
  }
}

export class MpxScroll {
  constructor (el, options) {
    this.options = options
    this.el = getElement(el)
    this.screen = document.documentElement || document.body
    this.scrollTop = 0
    this.screenHeight = this.screen.offsetHeight
    this.bottomReached = false
    this.ceiling = false
    this.scrollTimer = null
    this.debounce = options.debounce || 50
    this.hooks = new EventEmitter()
    this.eventRegister = new EventRegister()
  }

  enablePullDownRefresh () {
    const el = this.screen
    this.eventRegister.on(el, 'touchstart', e => this.onTouchStart(e))
    this.eventRegister.on(el, 'touchmove', e => this.onTouchMove(e))
    this.eventRegister.on(el, 'touchend', e => this.onTouchEnd(e))
  }

  enableScroll () {
    this.eventRegister.on(document, 'scroll', e => {
      if (this.scrollTimer) {
        this.clearScrollTimer()
      }
      this.scrollTimer = setTimeout(() => {
        const scrollTop = this.screen.scrollTop
        this.scrollTop = scrollTop
        this.hooks.emit('scroll', scrollTop)
      }, this.debounce)
    })
  }

  destroy () {
    this.hooks.destroy()
    this.eventRegister.destroy()
  }

  clearScrollTimer () {
    if (this.scrollTimer) {
      clearTimeout(this.scrollTimer)
      this.scrollTimer = null
    }
  }

  pageScrollTo ({
    scrollTop,
    selector,
    duration = 300
  }) {
    const speed = duration / 16
    let position = this.screen.scrollTop
    let step
    let _scrollTop

    if (isDef(scrollTop)) {
      _scrollTop = scrollTop
    } else if (isDef(selector)) {
      _scrollTop = getOffsetTop(getElement(selector))
    }

    step = Math.abs(position - _scrollTop) / speed

    const next = (() => {
      // fix eslint
      const requestAnimationFrame = window.requestAnimationFrame
      if (position < _scrollTop) {
        return () => {
          requestAnimationFrame(() => {
            position += step
            if (position < _scrollTop) {
              this.screen.scrollTo(0, position)
              next()
            } else {
              this.screen.scrollTo(0, _scrollTop)
            }
          })
        }
      } else {
        return () => {
          requestAnimationFrame(() => {
            position -= step
            if (position > _scrollTop) {
              this.screen.scrollTo(0, position)
              next()
            } else {
              this.screen.scrollTo(0, _scrollTop)
            }
          })
        }
      }
    })()

    next()
  }

  startPullDownRefresh () {
    this.pageScrollTo({
      scrollTop: 0,
      duration: 0
    })
    this.pullDown(this.options.pullDownRefresh.threshold)
    this.hooks.emit('pullingDown')
  }

  stopPullDownRefresh () {
    const style = this.el.style
    style.transition = style.transform = ''
  }

  resetTouchStatus () {
    this.direction = ''
    this.deltaX = 0
    this.deltaY = 0
    this.offsetX = 0
    this.offsetY = 0
  }

  checkPullStart (e) {
    this.ceiling = this.scrollTop <= 0

    if (this.ceiling) {
      this.duration = 0
      this.touchStart(e)
    }
  }

  onTouchStart (e) {
    this.checkPullStart(e)
  }

  touchStart (e) {
    this.resetTouchStatus()
    this.startX = e.touches[0].clientX
    this.startY = e.touches[0].clientY
  }

  onTouchMove (e) {
    if (!this.ceiling) {
      this.checkPullStart(e)
    }
    this.touchMove(e)
    if (this.ceiling && this.deltaY >= 0 && this.direction === 'vertical') {
      preventDefault(e)
      this.pullDown(this.ease(this.deltaY))
    }
  }

  pullDown (distance, isLoading) {
    let status
    if (isLoading) {
      status = 'loading'
    } else if (distance === 0) {
      status = 'normal'
    } else {
      status = distance < this.options.pullDownRefresh.threshold ? 'pulling' : 'loosing'
    }

    this.distance = distance

    if (status !== this.status) {
      this.status = status
    }

    this.el.style.cssText = `transform: translateY(${distance}px)`
  }

  /**
   * ease 减少页面下拉幅度
   */
  ease (distance) {
    const headHeight = +this.options.pullDownRefresh.threshold

    if (distance > headHeight) {
      if (distance < headHeight * 2) {
        distance = headHeight + (distance - headHeight) / 2
      } else {
        distance = headHeight * 1.5 + (distance - headHeight * 2) / 4
      }
    }

    return Math.round(distance)
  }

  touchMove (e) {
    const touch = e.touches[0]
    this.deltaX = touch.clientX - this.startX
    this.deltaY = touch.clientY - this.startY
    this.offsetX = Math.abs(this.deltaX)
    this.offsetY = Math.abs(this.deltaY)
    this.direction = this.direction || getDirection(this.offsetX, this.offsetY)
  }

  onTouchEnd () {
    if (this.deltaY >= this.options.pullDownRefresh.threshold) {
      this.el.style.transition = `transform 0.5s ease 3s`
      this.el.style.transform = 'translateY(0px)'
      this.hooks.emit('pullingDown', true)
    }
  }

  onReachBottom (onReachBottomDistance, callback) {
    const { bottom } = this.el.getBoundingClientRect()
    const mark = bottom - this.screenHeight <= onReachBottomDistance

    if (!this.bottomReached && mark) {
      this.bottomReached = true
      callback()
    } else if (!mark) {
      this.bottomReached = false
    }
  }
}
