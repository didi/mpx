import { error } from '../../helper/log'

const TIME_BOUNCE = 800
const PULL_DOWN_CONFIG = {
  threshold: 60,
  stop: 56
}

let loading, bs

function showLoading () {
  loading = loading || document.querySelector('.pull-down-loading')
  if (loading) {
    loading.style.display = 'block'
  }
}

function hideLoading () {
  loading = loading || document.querySelector('.pull-down-loading')
  if (loading) {
    loading.style.display = 'none'
  }
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

export default function onPageScroll (mixinType) {
  if (mixinType === 'page') {
    return {
      mounted () {
        if (!bs) {
          const bsConfig = {
            scrollY: true,
            probeType: 2,
            bounceTime: TIME_BOUNCE,
            pullDownRefresh: PULL_DOWN_CONFIG,
            observeDOM: !!this.$options.__mpxPageConfig.enableObserveDOM
          }
          try {
            bs = new global.BScroll(this.$el.parentNode.parentNode, bsConfig)
          } catch (e) {
            const location = this.__mpxProxy && this.__mpxProxy.options.mpxFileResource
            return error(`Better scroll init error, please check.`, location, e)
          }
        }
        this.__lastScrollY = 0
        this.__disposer = []
      },
      activated () {
        if (bs) {
          bs.refresh()
          // 恢复上次滚动位置
          bs.scrollTo(0, this.__lastScrollY)
          // 处理禁止滚动
          if (this.$options.__mpxPageConfig.disableScroll) {
            bs.disable()
          } else {
            bs.enable()
            // 处理下拉刷新效果
            if (this.$options.__mpxPageConfig.enablePullDownRefresh) {
              showLoading(this)
              bs.openPullDown(PULL_DOWN_CONFIG)
              on('pullingDown', this.__mpxPullDownHandler, this.__disposer)
              this.__initPullDownStyle()
            } else {
              hideLoading(this)
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
          if (this.$options.__mpxPageConfig.enablePullDownRefresh && bs) {
            bs.finishPullDown()
          }
        },
        refreshScroll () {
          bs && bs.refresh()
        },
        __mpxPageScrollHandler (pos) {
          if (bs) {
            // 处理onPageScroll
            this.onPageScroll && this.onPageScroll({ scrollTop: -pos.y })

            // 处理onReachBottom
            if (this.onReachBottom) {
              const onReachBottomDistance = this.$options.__mpxPageConfig.onReachBottomDistance || 50
              // 处理ReachBottom
              if (!this.__bottomReached && pos.y <= bs.maxScrollY + onReachBottomDistance && bs.movingDirectionY === 1) {
                this.__bottomReached = true
                this.onReachBottom()
              } else if (pos.y > bs.maxScrollY + onReachBottomDistance && bs.movingDirectionY === -1) {
                this.__bottomReached = false
              }
            }
          }
        },
        __initPullDownStyle () {
          const { backgroundColor = '#fff', backgroundTextStyle = 'dark' } = this.$options.__mpxPageConfig
          document.querySelector('.pull-down-loading').style.background = backgroundColor
          document.querySelector('.dot-flashing').classList.add(backgroundTextStyle)
        }
      }
    }
  }
}
