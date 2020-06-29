export default function onPageScroll (mixinType) {
  if (mixinType === 'page' && __mpx_mode__ === 'web') {
    return {
      activated () {
        if (this.$vnode.componentOptions && this.$vnode.componentOptions.Ctor.options.onPageScroll && this.$vnode.componentOptions.Ctor.options.onPageScroll[0].name === 'onPageScroll') {
          const onPageScroll = this.$vnode.componentOptions.Ctor.options.onPageScroll && this.$vnode.componentOptions.Ctor.options.onPageScroll[0]
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

              bscroll.on('scroll', onPageScrollHandler)

              function onPageScrollHandler (pos) {
                onPageScroll({ scrollTop: -pos.y })
              }
            })
        }
      }
    }
  }
}
