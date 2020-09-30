import { error } from '../../helper/log'
import { getOffsetTop, getElement, getScrollTop, preventDefault } from './dom'
import EventEmitter from './EventEmitter'
import EventRegister from './EventRegister'
import ScrollAnimation from './ScrollAnimation'

function isDef (val) {
  return val !== undefined
}

export default class MpxScroll {
  constructor (options = {}) {
    const defaultOptions = {
      threshold: 60, // 滑动触发下拉刷新的距离
      stop: 56, // 下拉刷新时停留的位置距离屏幕顶部的距离
      bounceTime: 800, // 设置回弹动画的动画时长
      debounce: 50 // 页面滚动防抖延时时间
    }
    this.options = Object.assign({}, defaultOptions, options)
    this.ratio = 0.5 // 下拉阻尼系数
    this.el = getElement('.page')
    this.touchstartY = 0
    this.currentY = 0
    this.translateY = 0
    this.legacyY = 0
    this.isIntersecting = false
    this.isRefresh = false
    this.bottomReached = false
    this.scrollTimer = null
    this.intersectionOb = null

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
    // fix lint
    const IntersectionObserver = window.IntersectionObserver
    const ob = this.intersectionOb = new IntersectionObserver(changes => {
      const [change] = changes
      const isIntersecting = change.isIntersecting
      this.isIntersecting = isIntersecting
      if (!isIntersecting) {
        // 非 inter section 状态下及时清除 transtorm，以免影响正常滚动时元素的 fixed 定位
        this.el.style.cssText = ''
      }
    })
    ob.observe(document.querySelector('.pull-down-loading'))

    this.hooks.move.on((bounceTime, beginPosition, endPosition) => {
      this.scrollAnimation.easeOutQuart(bounceTime, beginPosition, endPosition, distance => {
        this.transformPage(distance)
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
    this.currentY = e.targetTouches[0].clientY
    if (this.currentY - this.touchstartY >= 0 && this.isIntersecting) {
      preventDefault(e)
      if (this.isRefresh) {
        this.legacyY = this.translateY
        this.isRefresh = false
      }
      this.pullDown(this.currentY - this.touchstartY)
    }
  }

  pullDown (distance) {
    const alteredDistance = distance * this.ratio + this.legacyY
    this.transformPage(alteredDistance)
  }

  transformPage (distance) {
    this.translateY = distance
    this.el.style.cssText = `transform: translateY(${distance}px)`
  }

  onTouchEnd (e) {
    if (this.isRefresh) {
      return
    }

    if (this.translateY >= this.options.threshold) {
      this.isRefresh = true
      this.hooks.pullingDown.emit(true, true)
      this.moveBack(this.translateY)
    } else if (this.translateY > 0) {
      this.moveBack(this.translateY)
      this.isRefresh = false
    }
  }

  moveBack (distance) {
    const { stop, threshold, bounceTime } = this.options
    const finalDistance = distance >= threshold
      ? stop
      : 0
    this.hooks.move.emit(bounceTime, distance, finalDistance)
  }

  useScroll () {
    this.eventRegister.on(document, 'scroll', e => {
      if (this.scrollTimer) {
        this.clearScrollTimer()
      }
      this.scrollTimer = setTimeout(() => {
        const scrollTop = window.pageYOffset
        this.scrollTop = scrollTop
        this.hooks.scroll.emit(scrollTop)
      }, this.options.debounce)
    })
  }

  clearScrollTimer () {
    if (this.scrollTimer) {
      clearTimeout(this.scrollTimer)
      this.scrollTimer = null
    }
  }

  destroy () {
    const hooks = this.hooks
    Object.keys(hooks).forEach(hook => {
      this.hooks[hook].destroy()
    })
    this.eventRegister.destroy()
    this.clearScrollTimer()
    this.intersectionOb && this.intersectionOb.disconnect()
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
    this.legacyY = 0
  }

  pageScrollTo ({
    scrollTop,
    selector,
    duration = 300
  }) {
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

    const position = getScrollTop()

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
