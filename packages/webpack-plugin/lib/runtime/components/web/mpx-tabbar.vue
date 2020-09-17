<script>
  import Vue from 'vue'
  import getInnerListeners from '@mpxjs/webpack-plugin/lib/runtime/components/web/getInnerListeners'

  const tabBarMap = window.__tabBar
  export default {
    name: 'mpx-tabbar',
    props: {
      current: {
        type: Number,
        default: 0
      },
      bindchange: {
        type: Function,
        default: () => {}
      }
    },
    data () {
      return {
        currentIndex: 0,
        color: '',
        backgroundColor: '',
        borderStyle: '',
        selectedColor: '',
        position: 'bottom',
        list: []
      }
    },
    computed: {
      wrapperStyle () {
        let style = `background-color: ${this.backgroundColor}; border-top: 1px solid ${this.borderStyle};`
        style += this.position === 'bottom' ? 'bottom: 0;' : 'top: 0;'
        return style
      },
    },
    watch: {
      current (value) {
        this.currentIndex = value
      }
    },
    mounted () {
      this.currentIndex = this.current || 0
      this.backgroundColor = tabBarMap.backgroundColor
      this.borderStyle = tabBarMap.borderStyle || ''
      this.extClass = tabBarMap.extClass || ''
      this.position = tabBarMap.position || 'bottom'
      this.list = tabBarMap.list
    },
    methods: {
      itemClickHandler (item, index) {
        this.currentIndex = index
        tabBarMap.current = index
        this.$emit('bindchange', item, index)
      },
      setTabBar (index) { // 动态设置 tabBar 某一项的内容
        if (index > this.list.length) {
          console.warn('设置选项超出 tabBar 下标')
        }
        this.currentIndex = index
      },
      getTabBar () { // 自定义组件新增 getTabBar 接口，可获取当前页面下的自定义 tabBar 组件实例
        return this.list[this.currentIndex]
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
            src: this.currentIndex === index? item.selectedIconPath : item.iconPath
          },
          on: getInnerListeners(this, { ignoredListeners: ['load', 'error'] })
        })
      const textSpan = (item, index) => createElement('span',
        {
          class: 'tab-cell',
          style: { color: this.currentIndex === index? tabBarMap.selectedColor: tabBarMap.color },
          domProps: {innerHTML: item.text}
        }
      )

      const tabBarWrapper = createElement('div', {class: 'tabbar-wrapper'},
      [tabBarMap.list.map((item, index) => {
        return createElement('div', {class: 'tab-item', on: {click: this.itemClickHandler.bind(this, item, index)}},
          item.selectedIconPath||item.iconPath?
            [iconImage(item, index), textSpan(item, index)]
            : [textSpan(item, index)]
        )
      })])
      return createElement('div',
        {
          class: 'mpx-tabbar-container',
          style: this.wrapperStyle,
        },
        [tabBarWrapper]
      )
    }
  }
</script>

<style lang="stylus" rel="stylesheet/stylus">
  .mpx-tabbar-container
    position: fixed
    left: 0
    right: 0
    width: 100%
    height: 48px // TODO 确认下高度是否需要做成可配置？
    .tabbar-wrapper
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
