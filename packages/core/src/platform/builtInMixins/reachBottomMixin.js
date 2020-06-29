export default function onReachBottom (mixinType) {
  if (mixinType === 'page' && __mpx_mode__ === 'web') {
    return {
      activated () {
        if (this.$vnode.componentOptions && !!this.$vnode.componentOptions.Ctor.options.onReachBottomDistance) {
          const onReachBottomDistance = this.$vnode.componentOptions.Ctor.options.onReachBottomDistance || 50
          const onReachBottomMethod = this.$vnode.componentOptions.Ctor.options.onReachBottom ? this.$vnode.componentOptions.Ctor.options.onReachBottom[0] : function () {}
          this.$vnode.elm.parentNode.style.position = 'fixed'
          this.$vnode.elm.parentNode.style.top = 0
          this.$vnode.elm.parentNode.style.left = 0
          this.$vnode.elm.parentNode.style.bottom = 0
          this.$vnode.elm.parentNode.style.right = 0
          import('@better-scroll/core')
            .then(res => res.default)
            .then(BScroll => {
              let bscroll = new BScroll(this.$vnode.elm.parentNode, {
                scrollY: true,
                click: true,
                probeType: 2
              })

              bscroll.on('scroll', onReachBottomHandler)

              let flag = true
              function onReachBottomHandler (pos) {
                if ((pos.y > bscroll.maxScrollY + onReachBottomDistance && pos.y < bscroll.maxScrollY + onReachBottomDistance + 5) && bscroll.movingDirectionY === 1 && flag) {
                  flag = false
                  onReachBottomMethod()
                } else if (pos.y > bscroll.maxScrollY + onReachBottomDistance && bscroll.movingDirectionY === -1) {
                  flag = true
                }
              }
            })
        }
      }
    }
  }
}
