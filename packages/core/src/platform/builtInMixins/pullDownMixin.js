// web 下拉刷新事件
const TIME_BOUNCE = 800
const STOP = 56
const THRESHOLD = 60

export default function onPullDownRefresh (mixinType) {
  if (mixinType === 'page' && __mpx_mode__ === 'web') {
    return {
      activated () {
        if (this.$vnode.componentOptions && this.$vnode.componentOptions.Ctor.options.enablePullDownRefresh) {
          const onPullDownRefreshMethod = this.$vnode.componentOptions.Ctor.options.onPullDownRefresh ? this.$vnode.componentOptions.Ctor.options.onPullDownRefresh[0] : function () {
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

          this.$vnode.elm.parentNode.style.position = 'fixed'
          this.$vnode.elm.parentNode.style.top = 0
          this.$vnode.elm.parentNode.style.left = 0
          this.$vnode.elm.parentNode.style.bottom = 0
          this.$vnode.elm.parentNode.style.right = 0

          // eslint-disable-next-line no-undef
          let bscroll = new BScroll(this.$vnode.elm.parentNode, {
            pullUpLoad: {
              threshold: 20
            },
            bounceTime: TIME_BOUNCE,
            pullDownRefresh: {
              threshold: THRESHOLD,
              stop: STOP
            }
          })

          bscroll.on('pullingDown', pullingDownHandler)

          // eslint-disable-next-line no-inner-declarations
          async function pullingDownHandler () {
            await requestData()
            bscroll.finishPullDown()
            bscroll.refresh()
          }

          // eslint-disable-next-line no-inner-declarations
          async function requestData () {
            try {
              await ajaxGet(/* url */)
            } catch (err) {
              console.log(err)
            }
          }

          // eslint-disable-next-line no-inner-declarations
          function ajaxGet (/* url */) {
            return new Promise(resolve => {
              setTimeout(() => {
                const result = onPullDownRefreshMethod()
                resolve(result)
              }, 3000)
            })
          }
        }
      }
    }
  }
}
