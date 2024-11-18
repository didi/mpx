import { getOffsetTop, getElement, getScrollTop, preventDefault } from './dom'
import EventEmitter from './EventEmitter'
import EventRegister from './EventRegister'
import ScrollAnimation from './ScrollAnimation'
import throttle from 'lodash/throttle'

function isDef (val) {
  return val !== undefined
}

export default class MpxScroll {
  constructor (options = {}) {
    const defaultOptions = {
      threshold: 60, // 滑动触发下拉刷新的距离
      stop: 56, // 下拉刷新时停留的位置距离屏幕顶部的距离
      bounceTime: 800, // 设置回弹动画的动画时长
      throttle: 50 // 页面滚动节流
    }
    this.options = Object.assign({}, defaultOptions, options)

    // 下拉阻尼系数
    this.ratio = 0.5

    this.el = getElement('page')
    this.touchstartY = 0
    this.currentY = 0
    this.translateY = 0

    // 为了不阻断用户交互，在 pull down 过程中允许用户可以再次做下拉动作。
    // 记录上次 pull down 的 translateY，再次下拉时加上这个 legacy 作为起始点
    // 避免再次 touchstart 的时候 translateY 从某个值突然小于正处于 pull down 状态的 loading 高度
    this.legacyY = 0

    this.isIntersecting = false
    this.isRefresh = false
    this.bottomReached = false

    const hooks = [
      'scroll', // 页面自然滚动
      'pullingDown' // pullDown 事件
    ]
    this.hooks = {}
    hooks.forEach(hook => {
      this.hooks[hook] = new EventEmitter()
    })
    this.scrollAnimation = new ScrollAnimation()
    this.pullDownEventRegister = null
    this.scrollEventRegister = null
    this.intersectionOb = null
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
        this.pullDownEventRegister && this.pullDownEventRegister.destroy()
      } else {
        this.pullDownEventRegister = new EventRegister(this.el, [
          {
            name: 'touchstart',
            handler: e => this.onTouchStart(e)
          },
          {
            name: 'touchmove',
            handler: e => this.onTouchMove(e)
          },
          {
            name: 'touchend',
            handler: e => this.onTouchEnd(e)
          }
        ])
      }
    })
    ob.observe(document.querySelector('.pull-down-loading'))
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
    this.move(bounceTime, distance, finalDistance)
  }

  useScroll () {
    const pageScrollHandler = throttle(e => {
      const _e = {}
      Object.defineProperty(_e, 'scrollTop', {
        configurable: false,
        enumerable: true,
        get: () => getScrollTop()
      })
      this.hooks.scroll.emit(_e)
    }, this.options.throttle, {
      leading: true,
      trailing: true
    })
    this.scrollEventRegister = new EventRegister(document, [
      {
        name: 'scroll',
        handler: pageScrollHandler
      }
    ])
  }

  destroy () {
    const hooks = this.hooks
    Object.keys(hooks).forEach(hook => {
      this.hooks[hook].destroy()
    })
    this.scrollEventRegister && this.scrollEventRegister.destroy()
    this.pullDownEventRegister && this.pullDownEventRegister.destroy()
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
    this.move(bounceTime, 0, stop)
  }

  stopPullDownRefresh () {
    if (!this.isRefresh) {
      return
    }
    const { stop, bounceTime } = this.options
    this.move(bounceTime, stop, 0)
    this.isRefresh = false
    this.legacyY = 0
  }

  move (bounceTime, beginPosition, endPosition) {
    this.scrollAnimation.easeOutQuart(
      bounceTime,
      beginPosition,
      endPosition,
      distance => this.transformPage(distance)
    )
  }

  pageScrollTo ({ scrollTop, selector, duration = 300 }) {
    let _scrollTop

    if (isDef(scrollTop)) {
      _scrollTop = scrollTop
    } else if (isDef(selector)) {
      _scrollTop = getOffsetTop(getElement(selector))
    } else {
      return console.error('[pageScrollTo error]: scrollTop and selector are not defined')
    }

    if (duration === 0) {
      return window.scrollTo(0, _scrollTop)
    }

    const position = getScrollTop()

    this.scrollAnimation.easeOutQuart(duration, position, _scrollTop, distance => {
      window.scrollTo(0, distance)
    })
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
