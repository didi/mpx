<script>
import mpx from '@mpxjs/core'
export default {
  name: 'mpx-titlebar',
  props: {
    // 来自 app.json 中 window 的 titlebar 相关配置
    windowConfig: {
      type: Object,
      default: () => global.__mpxPageConfig
    },
    // 来自 页面 json 中的 titlebar 相关配置，会覆盖 windowConfig
    pageConfig: {
      type: Object,
      default: () => ({})
    }
  },
  computed: {
    // 合并全局 window 配置与页面配置（页面配置覆盖全局配置）
    cfg () {
      return Object.assign({}, this.windowConfig || {}, this.pageConfig || {})
    },
    // 标题文本（兼容常见字段名）
    titleText () {
      return this.cfg.navigationBarTitleText || this.cfg.title || ''
    },
    // 背景色（兼容常见字段）
    backgroundColor () {
      return this.cfg.navigationBarBackgroundColor || '#ffffff'
    },
    // 文本颜色，微信小程序中 navigationBarTextStyle 为 white 或 black
    textColor () {
      const style = this.cfg.navigationBarTextStyle || 'black'
      return style === 'white' ? '#ffffff' : '#000000'
    },
    // navigationStyle: 'default' | 'custom'，custom 表示需要自定义绘制
    navigationStyle () {
      return this.cfg.navigationStyle || 'default'
    },
    // 是否隐藏（navigationStyle 为 'custom' 时也应隐藏）
    hidden () {
      return mpx.config?.webConfig?.enableTitleBar !== true || this.navigationStyle === 'custom'
    },
    // 是否展示返回按钮：根据浏览器历史判断（不依赖额外 page 配置）
    showBack () {
      console.log('showBack', this.$router.stack.length)
      try {
        return this.$router.stack.length > 1
      } catch (e) {
        return false
      }
    },
    // safe area 顶部 padding，使用 env(safe-area-inset-top)
    safeStyle () {
      // 多数浏览器支持 env(), 为兼容也使用 constant() 备选（旧 iOS Safari）
      return {
        paddingTop: 'env(safe-area-inset-top, 0px)'
      }
    },
    // 内部标题栏高度（遵循小程序常见平台差异）
    innerHeight () {
      const isIOS = /iP(hone|od|ad)/.test(navigator.userAgent)
      return (isIOS ? 44 : 48) + 'px'
    },
    rootStyle () {
      return {
        background: this.backgroundColor,
        color: this.textColor
      }
    },
    innerStyle () {
      return {
        height: this.innerHeight
      }
    }
    ,
    // content wrapper style: padding-top to avoid being covered by fixed titlebar
    contentStyle () {
      // use calc to combine innerHeight and safe-area inset
      return {
        paddingTop: this.hidden ? '0px' : `calc(${this.innerHeight} + env(safe-area-inset-top, 0px))`,
        // create its own layer to avoid overlapping issues
        transform: 'translateZ(0)',
        willChange: 'transform'
      }
    }
  },
  methods: {
    // 左侧点击：派发事件并在可回退时回退
    onLeftClick (e) {
      this.$emit('click-left', e)
      if (this.showBack) {
        try { window.history.back() } catch (err) {}
      }
    }
  },
  render (h) {
    const leftChildren = []

    // default back button (SVG) — no left slot support
    if (this.showBack) {
      leftChildren.push(
        h('button', {
          class: 'mpx-titlebar__back',
          attrs: { 'aria-label': 'back', type: 'button' }
        }, [
          h('svg', {
            attrs: {
              viewBox: '0 0 24 24',
              width: '20',
              height: '20',
              fill: 'none',
              xmlns: 'http://www.w3.org/2000/svg',
              focusable: 'false',
              'aria-hidden': 'true'
            }
          }, [
            h('path', {
              attrs: {
                d: 'M15 18l-6-6 6-6',
                stroke: 'currentColor',
                'stroke-width': '2',
                'stroke-linecap': 'round',
                'stroke-linejoin': 'round'
              }
            })
          ])
        ])
      )
    }

    // center shows title; only default slot (page content) is supported
    const centerChildren = [
      h('div', { class: 'mpx-titlebar__title', style: { color: this.textColor } }, [this.titleText])
    ]

  // top-level wrapper: contains fixed titlebar and page content wrapper
  return h('page', { class: 'mpx-titlebar-wrapper' }, [
      // fixed titlebar
      h('div', {
        class: ['mpx-titlebar', { 'mpx-titlebar--hidden': this.hidden }],
        style: this.rootStyle
      }, [
        h('div', { class: 'mpx-titlebar__safe', style: this.safeStyle }, [
          h('div', { class: 'mpx-titlebar__inner', style: this.innerStyle }, [
              h('div', { class: 'mpx-titlebar__left', on: { click: this.onLeftClick } }, leftChildren),
              h('div', { class: 'mpx-titlebar__center' }, centerChildren),
              h('div', { class: 'mpx-titlebar__right' }, [])
          ])
        ])
      ]),

      // page content wrapper: default slot is page content
      h('div', { class: 'mpx-titlebar__content', style: this.contentStyle }, this.$slots.default || [])
    ])
  }
}
</script>

<style scoped>
.mpx-titlebar {
  width: 100%;
  box-sizing: border-box;
  -webkit-font-smoothing: antialiased;
}
.mpx-titlebar--hidden {
  display: none;
}
.mpx-titlebar__safe {
  /* safe area handled by padding-top; include both env and constant for broader iOS support */
  padding-top: env(safe-area-inset-top, 0px);
  padding-top: constant(safe-area-inset-top, 0px);
}
.mpx-titlebar__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  box-sizing: border-box;
}
.mpx-titlebar__left,
.mpx-titlebar__right {
  flex: 0 0 auto;
  min-width: 44px;
  display: flex;
  align-items: center;
}
.mpx-titlebar__center {
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 0 8px;
}
.mpx-titlebar__title {
  font-size: 17px;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  font-weight: 500;
}
.mpx-titlebar__back {
  background: none;
  border: none;
  font-size: 20px;
  color: inherit;
  padding: 6px;
  cursor: pointer;
}

/* wrapper and content layout */
.mpx-titlebar-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.mpx-titlebar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000; /* ensure above page content */
}

.mpx-titlebar__content {
  position: relative;
  width: 100%;
  min-height: 100%;
  box-sizing: border-box;
  background: transparent;
}

/* SVG icon sizing and inherit color */
.mpx-titlebar__back svg {
  display: block;
  width: 20px;
  height: 20px;
}
.mpx-titlebar__back path {
  stroke: currentColor;
}
</style>
