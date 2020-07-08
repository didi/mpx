
export default function onPageScroll (mixinType) {
  if (mixinType === 'page' && __mpx_mode__ === 'web') {
    const TIME_BOUNCE = 800
    const STOP = 56
    const THRESHOLD = 60
    return {
      data () {
        return {
          onPullDownRefreshMethod: '',
          onPageScrollMethod: '',
          onReachBottomDistance: '',
          onReachBottomMethod: '',
          flag: true
        }
      },
      computed: {
        isWrapper () {
          return this.isOnPageScroll || this.isEnablePullDownRefresh || this.isOnReachBottomDistance
        },
        isOnPageScroll () {
          return this.$vnode.componentOptions && this.$vnode.componentOptions.Ctor.options.onPageScroll && this.$vnode.componentOptions.Ctor.options.onPageScroll[0].name === 'onPageScroll'
        },
        isEnablePullDownRefresh () {
          return this.$vnode.componentOptions && this.$vnode.componentOptions.Ctor.options.enablePullDownRefresh
        },
        isOnReachBottomDistance () {
          return this.$vnode.componentOptions && !!this.$vnode.componentOptions.Ctor.options.onReachBottomDistance
        }
      },
      mounted () {
        if (this.isWrapper) {
          this.$vnode.elm.style.position = 'fixed'
          this.$vnode.elm.style.top = 0
          this.$vnode.elm.style.left = 0
          this.$vnode.elm.style.bottom = 0
          this.$vnode.elm.style.right = 0
        }
        // eslint-disable-next-line no-undef
        window.bsIns = new __mpxBsIns(this.$vnode.elm, {
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
        if (this.isOnPageScroll) {
          this.onPageScrollMethod = this.$vnode.componentOptions.Ctor.options.onPageScroll && this.$vnode.componentOptions.Ctor.options.onPageScroll[0]
          window.bsIns.on('scroll', this.onPageScrollHandler)
        }
        if (this.isOnReachBottomDistance) {
          this.onReachBottomDistance = this.$vnode.componentOptions.Ctor.options.onReachBottomDistance || 50
          // eslint-disable-next-line no-mixed-operators
          this.onReachBottomMethod = this.$vnode.componentOptions.Ctor.options.onReachBottom && this.$vnode.componentOptions.Ctor.options.onReachBottom[0] || function () {}
          window.bsIns.on('scroll', this.onReachBottomHandler)
        }
        if (this.isEnablePullDownRefresh) {
          // eslint-disable-next-line no-mixed-operators
          this.onPullDownRefreshMethod = this.$vnode.componentOptions.Ctor.options.onPullDownRefresh && this.$vnode.componentOptions.Ctor.options.onPullDownRefresh[0] || function () {
            try {
              return new Promise((resolve) => {
                setTimeout(function () {
                  resolve()
                }, 1000)
              })
            } catch (err) {
              console.log(err)
            }
          }

          let loading = this.$vnode.elm.firstChild.appendChild(document.createElement('div'))
          loading.innerHTML = 'loading...'
          loading.style.position = 'absolute'
          loading.style.width = '100%'
          loading.style.padding = '20px'
          loading.style.boxSizing = 'border-box'
          loading.style.transform = 'translateY(-100%) translateZ(0)'
          loading.style.textAlign = 'center'
          loading.style.color = '#999'
          loading.style.top = 0

          window.bsIns.on('pullingDown', this.pullingDownHandler)
        } else {
          window.bsIns.closePullDown()
        }
      },
      methods: {

        async pullingDownHandler () {
          await this.requestData()
          window.bsIns.finishPullDown()
          window.bsIns.refresh()
        },

        async requestData () {
          try {
            await this.ajaxGet(/* url */)
          } catch (err) {
            console.log(err)
          }
        },

        ajaxGet (/* url */) {
          return new Promise(resolve => {
            setTimeout(() => {
              const result = this.onPullDownRefreshMethod()
              resolve(result)
            }, 3000)
          })
        },

        onPageScrollHandler (pos) {
          this.onPageScrollMethod({ scrollTop: -pos.y })
        },

        onReachBottomHandler (pos) {
          if ((pos.y > window.bsIns.maxScrollY + this.onReachBottomDistance && pos.y < window.bsIns.maxScrollY + this.onReachBottomDistance + 5) && window.bsIns.movingDirectionY === 1 && this.flag) {
            this.flag = false
            this.onReachBottomMethod()
          } else if (pos.y > window.bsIns.maxScrollY + this.onReachBottomDistance && window.bsIns.movingDirectionY === -1) {
            this.flag = true
          }
        }
      }
    }
  }
}
