<script>
  import getInnerListeners from './getInnerListeners'

  const tabBar = global.__tabBar
  export default {
    name: 'mpx-tab-bar',
    props: {
      currentIndex: {
        type: Number,
        default: 0
      }
    },
    computed: {
      wrapperStyle () {
        let style = `background-color: ${tabBar.backgroundColor}; border-top: 1px solid ${tabBar.borderStyle};`
        style += tabBar.position === 'bottom' ? 'bottom: 0;' : 'top: 0;'
        return style
      }
    },
    methods: {
      itemClickHandler (item, index) {
        this.$emit('change', item, index)
      }
    },
    render (createElement) {
      const iconImage = (item, index) => createElement('img',
        {
          class: 'icon',
          style: {
            height: '26px',
            width: '26px'
          },
          domProps: {
            src: this.currentIndex === index && item.selectedIconPath ? item.selectedIconPath : item.iconPath
          },
          on: getInnerListeners(this, { ignoredListeners: ['load', 'error'] })
        })
      const textSpan = (item, index) => createElement('span',
        {
          class: 'tab-cell',
          style: { color: this.currentIndex === index ? tabBar.selectedColor : tabBar.color },
          domProps: { innerHTML: item.text }
        }
      )

      const tabBarWrapper = createElement('div', { class: 'tab-bar-wrapper' },
        [tabBar.list.map((item, index) => {
          return createElement('div', {
              class: 'tab-item',
              on: { click: this.itemClickHandler.bind(this, item, index) }
            },
            item.iconPath ? [iconImage(item, index), textSpan(item, index)] : [textSpan(item, index)]
          )
        })])
      return createElement('div',
        {
          class: 'mpx-tab-bar',
          style: this.wrapperStyle,
        },
        [tabBarWrapper]
      )
    }
  }
</script>

<style lang="stylus" rel="stylesheet/stylus">
  .mpx-tab-bar
    position: fixed
    left: 0
    right: 0
    width: 100%
    height: 48px // TODO 确认下高度是否需要做成可配置？

    .tab-bar-wrapper
      display flex
      align-items center
      height 100%

    .tab-item
      flex 1
      text-align center
      height 100%
      display flex
      align-items center
      justify-content center
      flex-direction column
      cursor pointer
</style>
