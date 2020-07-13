
let onceWrapper = true // 实现body多个页面只设置一次定位
const TIME_BOUNCE = 800
const STOP = 56
const THRESHOLD = 60
export default function onPageScroll (mixinType) {
  if (mixinType === 'page' && __mpx_mode__ === 'web') {
    return {
      activated () {
        // 初始化body样式，实现wrapper效果
        if (
          (this.$vnode.componentOptions && this.$vnode.componentOptions.Ctor.options.onPageScroll && this.$vnode.componentOptions.Ctor.options.onPageScroll[0].name === 'onPageScroll') ||
          (this.$vnode.componentOptions && this.$vnode.componentOptions.Ctor.options.enablePullDownRefresh) ||
          (this.$vnode.componentOptions && !!this.$vnode.componentOptions.Ctor.options.onReachBottomDistance)
        ) {
          // 如果页面有滚动、下拉、触底其中一个方法，则将body设置样式
          if (onceWrapper) {
            this.$vnode.elm.parentNode.style.position = 'fixed'
            this.$vnode.elm.parentNode.style.top = 0
            this.$vnode.elm.parentNode.style.left = 0
            this.$vnode.elm.parentNode.style.bottom = 0
            this.$vnode.elm.parentNode.style.right = 0
            onceWrapper = false
          }
        } else {
          // 页面如果没有滚动、触底、刷新将body样式清除，并且将onceWrapper设置为true
          this.$vnode.elm.parentNode.style.position = ''
          this.$vnode.elm.parentNode.style.top = ''
          this.$vnode.elm.parentNode.style.left = ''
          this.$vnode.elm.parentNode.style.bottom = ''
          this.$vnode.elm.parentNode.style.right = ''
          onceWrapper = true
        }
        if (this.bsIns) {
          this.bsIns.refresh()
        } else {
          // eslint-disable-next-line no-undef
          this.bsIns = new BScroll(this.$vnode.elm.parentNode, {
            scrollY: true,
            probeType: 2,
            pullUpLoad: {
              threshold: 20
            },
            bounceTime: TIME_BOUNCE,
            pullDownRefresh: {
              threshold: THRESHOLD,
              stop: STOP
            }
          })
        }

        // 处理下拉刷新效果
        if (this.$vnode.componentOptions.Ctor.options.enablePullDownRefresh) {
          let loading = this.$vnode.elm.appendChild(document.createElement('div'))
          loading.innerHTML = 'loading...'
          loading.style.position = 'absolute'
          loading.style.width = '100%'
          loading.style.padding = '20px'
          loading.style.boxSizing = 'border-box'
          loading.style.transform = 'translateY(-100%) translateZ(0)'
          loading.style.textAlign = 'center'
          loading.style.color = '#999'
          loading.style.top = 0
          this.bsIns.on('pullingDown', this.__mpxPullingDownHandler)
        } else {
          this.bsIns.closePullDown()
        }

        // 处理滚动事件
        if (
          (this.$vnode.componentOptions.Ctor.options.onPageScroll && this.$vnode.componentOptions.Ctor.options.onPageScroll[0].name === 'onPageScroll') ||
          (!!this.$vnode.componentOptions.Ctor.options.onReachBottomDistance)
        ) {
          this.flag = true // 设置一个标志位确保误差在5px的范围内下滑的时候只打印一次
          this.bsIns.on('scroll', this.__mpxPageScrollHandler)
        }
      },
      deactivated () {
        this.bsIns.off('scroll', this.__mpxPageScrollHandler)
        this.bsIns.off('pullingDown', this.__mpxPullingDownHandler)
      },
      methods: {

        // 执行拉下刷新方法
        async __mpxPullingDownHandler () {
          // eslint-disable-next-line no-mixed-operators
          let onPullDownRefreshMethod = this.$vnode.componentOptions.Ctor.options.onPullDownRefresh && this.$vnode.componentOptions.Ctor.options.onPullDownRefresh[0] || function () {}
          await new Promise(resolve => {
            setTimeout(() => {
              resolve(onPullDownRefreshMethod())
            }, 2000)
          })
          this.bsIns.finishPullDown()
          this.bsIns.refresh()
        },

        __mpxPageScrollHandler (pos) {
          // 判断是否满足滚动条件，并执行滚动方法
          if (this.$vnode.componentOptions.Ctor.options.onPageScroll && this.$vnode.componentOptions.Ctor.options.onPageScroll[0]) {
            this.$vnode.componentOptions.Ctor.options.onPageScroll[0]({ scrollTop: -pos.y })
          }

          // 判断是否满足触底条件，并执行触底方法
          if (this.$vnode.componentOptions.Ctor.options.onReachBottomDistance) {
            let onReachBottomDistance = typeof this.$vnode.componentOptions.Ctor.options.onReachBottomDistance === 'number' ? this.$vnode.componentOptions.Ctor.options.onReachBottomDistance : 50
            // eslint-disable-next-line no-mixed-operators
            let onReachBottomMethod = this.$vnode.componentOptions.Ctor.options.onReachBottom && this.$vnode.componentOptions.Ctor.options.onReachBottom[0] || function () {}
            if ((pos.y > this.bsIns.maxScrollY + onReachBottomDistance && pos.y < this.bsIns.maxScrollY + onReachBottomDistance + 5) && this.bsIns.movingDirectionY === 1 && this.flag) {
              this.flag = false
              onReachBottomMethod()
            } else if (pos.y > this.bsIns.maxScrollY + onReachBottomDistance && this.bsIns.movingDirectionY === -1) {
              this.flag = true
            }
          }
        }
      }
    }
  }
}
