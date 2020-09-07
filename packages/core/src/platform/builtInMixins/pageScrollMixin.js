import { error } from '../../helper/log'

const TIME_BOUNCE = 800
const PULL_DOWN_CONFIG = {
  threshold: 60,
  stop: 56
}

let bs

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

function on (event, handler, disposer = []) {
  if (bs) {
    bs.on(event, handler)
    disposer.push([event, handler])
  }
}

function off (disposer = []) {
  if (bs) {
    disposer.forEach((args) => {
      bs.off(args[0], args[1])
    })
  }
}

function needBs (vm) {
  const { disableScroll, enablePullDownRefresh } = vm.$options.__mpxPageConfig
  return disableScroll || enablePullDownRefresh || vm.onReachBottom || vm.onPageScroll
}

function refreshBs (vm) {
  // 待bs refresh方法支持替换content元素后，改为refresh实现
  if (bs) bs.destroy()
  const { enableObserveDOM = false } = vm.$options.__mpxPageConfig
  const bsConfig = {
    scrollY: true,
    click: true,
    probeType: 2,
    bounceTime: TIME_BOUNCE,
    pullDownRefresh: PULL_DOWN_CONFIG,
    observeDOM: enableObserveDOM
  }
  try {
    bs = new global.BScroll(vm.$el.parentNode, bsConfig)
  } catch (e) {
    const location = vm.__mpxProxy && vm.__mpxProxy.options.mpxFileResource
    return error(`Better scroll init error, please check.`, location, e)
  }
}

export default function onPageScroll (mixinType) {
  if (mixinType === 'page') {
    return {
      mounted () {
        this.__lastScrollY = 0
        this.__disposer = []
      },
      activated () {
        if (needBs(this)) {
          refreshBs(this)
          // 恢复上次滚动位置
          bs.scrollTo(0, this.__lastScrollY)
          // 处理禁止滚动
          const { disableScroll, enablePullDownRefresh } = this.$options.__mpxPageConfig
          if (disableScroll && !enablePullDownRefresh) {
            bs.disable()
          } else {
            bs.enable()
            // 处理下拉刷新效果
            if (enablePullDownRefresh) {
              showLoading(this)
              bs.openPullDown(PULL_DOWN_CONFIG)
              on('pullingDown', this.__mpxPullDownHandler, this.__disposer)
            } else {
              bs.closePullDown()
            }
            // 处理滚动事件
            if (this.onPageScroll || this.onReachBottom) {
              on('scroll', this.__mpxPageScrollHandler, this.__disposer)
            }
          }
        }
      },
      deactivated () {
        if (bs) {
          this.__lastScrollY = bs.y
          off(this.__disposer)
        }
      },
      beforeDestroy () {
        off(this.__disposer)
      },
      methods: {
        __mpxPullDownHandler () {
          // 处理onPullDownRefresh
          this.__pullingDown = true
          // 如果3s后用户还没有调用过__stopPullDownRefresh，则自动调用关闭pullDown，同微信保持一致
          setTimeout(() => {
            if (this.__pullingDown) this.__stopPullDownRefresh()
          }, 3000)
          this.onPullDownRefresh && this.onPullDownRefresh()
        },
        __stopPullDownRefresh () {
          this.__pullingDown = false
          const { enablePullDownRefresh } = this.$options.__mpxPageConfig
          if (enablePullDownRefresh && bs) {
            bs.finishPullDown()
          }
        },
        refreshScroll () {
          bs && bs.refresh()
        },
        __mpxPageScrollHandler (pos) {
          if (bs) {
            const { disableScroll, onReachBottomDistance = 50 } = this.$options.__mpxPageConfig
            // 处理onPageScroll
            this.onPageScroll && this.onPageScroll({ scrollTop: -pos.y })
            // 处理 disableScroll 和 enablePullDownRefresh 都为 true 时，
            // 向上拉动后还能继续向下滚动的问题
            if (disableScroll && pos.y < 0 && bs.movingDirectionY === 1) {
              bs.scrollTo(0, 0)
            }
            // 处理onReachBottom
            if (this.onReachBottom) {
              // 处理ReachBottom
              if (!this.__bottomReached && pos.y <= bs.maxScrollY + onReachBottomDistance && bs.movingDirectionY === 1) {
                this.__bottomReached = true
                this.onReachBottom()
              } else if (pos.y > bs.maxScrollY + onReachBottomDistance && bs.movingDirectionY === -1) {
                this.__bottomReached = false
              }
            }
          }
        }
      }
    }
  }
}
