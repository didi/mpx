import { error } from '../../helper/log'

let ms

function refreshMs (vm) {
  if (ms) ms.destroy()
  try {
    window.__mpxMs = ms = new MpxScroll(document.querySelector('.page'), {
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

export default function onPageScroll (mixinType) {
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
      if (disableScroll && !enablePullDownRefresh) {
        ms.disable()
      } else {
        ms.enable()
        // 下拉刷新
        if (enablePullDownRefresh) {
          showLoading(this)
          ms.on('pullingDown', this.__mpxPullDownHandler)
        } else {
          ms.stopPullDownRefresh()
        }
        // 页面滚动
        if (this.onPageScroll || this.onReachBottom) {
          ms.on('scroll', this.__mpxPageScrollHandler)
        }
      }
    },
    deactivated () {
      if (ms) {
        this.__lastScrollY = ms.scrollTop
        console.log(ms.scrollTop)
      }
    },
    beforeDestroy () {},
    methods: {
      __mpxPullDownHandler () {
        this.__pullingDown = true
        // 如果 3s 后用户还没有调用过 __stopPullDownRefresh，则自动调用关闭 pullDown，同微信保持一致
        setTimeout(() => {
          if (this.__pullingDown) this.__stopPullDownRefresh()
          console.log('pull down finish')
        }, 3000)
        this.onPullDownRefresh && this.onPullDownRefresh()
      },
      __stopPullDownRefresh () {
        this.__pullingDown = false
        const { enablePullDownRefresh } = this.$options.__mpxPageConfig
        if (enablePullDownRefresh && ms) {
          ms.stopPullDownRefresh()
        }
      },
      __mpxPageScrollHandler (scrollTop) {
        const { disableScroll, onReachBottomDistance = 50 } = this.$options.__mpxPageConfig

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

/**
 * EventEmitter
 */
function addEvent (el, type, handler) {
  el.addEventListener(type, handler, { passive: false })
}

function removeEvent (el, type, handler) {
  el.removeEventListener(type, handler)
}

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

  off (type) {
    this.events[type] = []
    return this
  }

  destroy () {
    this.events = {}
  }
}
/**
 * MpxScroll
 */
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

class MpxScroll extends EventEmitter {
  constructor (el, options) {
    super()
    this.options = options
    this.el = getElement(el)
    this.screen = document.documentElement || document.body
    this.screenHeight = this.screen.offsetHeight
    this.enabled = true
    this.bottomReached = false
    this.ceiling = false
    this.hooks = new EventEmitter()
    this.init()
  }

  init () {
    if (!this.enabled) {
      return
    }
    this.bindScrollEvent(document)
    this.bindTouchEvent(this.screen)
  }

  enable () {
    this.enabled = true
  }

  disable () {
    this.enabled = false
    this.destroy()
    this.events.forEach(type => removeEvent(document, type))
  }

  bindScrollEvent (el) {
    addEvent(el, 'scroll', e => {
      const scrollTop = this.screen.scrollTop
      this.scrollTop = scrollTop
      this.emit('scroll', scrollTop)
    })
  }

  pageScrollTo ({
    scrollTop,
    selector,
    duration = 300,
    success,
    fail,
    complete
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
            this.screen.scrollTo(0, position)
            if (position < _scrollTop) {
              next()
            }
          })
        }
      } else {
        return () => {
          requestAnimationFrame(() => {
            position -= step
            this.screen.scrollTo(0, position)
            if (position > _scrollTop) {
              next()
            }
          })
        }
      }
    })()

    next()
  }

  startPullDownRefresh () {
    this.pullDown(this.options.pullDownRefresh.threshold)
    this.emit('pullingDown')
  }

  stopPullDownRefresh () {
    const style = this.el.style
    style.transition = style.transform = ''
  }

  bindTouchEvent (el) {
    addEvent(el, 'touchstart', e => this.onTouchStart(e))
    addEvent(el, 'touchmove', e => this.onTouchMove(e))
    addEvent(el, 'touchend', e => this.onTouchEnd(e))
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
    this.el.style.position = 'relative'
    this.el.style.transition = 'transform 0s'
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
    console.log('onTouchEnd: ', this)
    if (this.deltaY >= this.options.pullDownRefresh.threshold) {
      this.el.style.transition = `transform 0.5s ease 3s`
      this.el.style.transform = 'translateY(0px)'
      this.emit('pullingDown')
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
