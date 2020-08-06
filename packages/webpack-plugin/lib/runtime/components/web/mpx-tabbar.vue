<script>
  import Vue from 'vue'

  const tabBarMap = Vue.observable(global.__tabBar)
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
        currentIndex: 0, // 当前被选中的tabbar
        color: '',
        backgroundColor: '',
        borderStyle: '',
        selectedColor: '',
        extClass: '',
        position: 'bottom',
        list: [],
        custom: false
      }
    },
    computed: {
      wrapperStyle () { // TODO border-top 1px 需要做适配处理
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
        global.__tabBar.current = index
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
      const iconImage = (item, index) => createElement('img', {class: 'icon', src: item.selectedIconPath || item.iconPath})
      const textSpan = (item, index) => createElement('span',
        {
          class: 'tab-cell',
          style:{ color: this.currentIndex === index? tabBarMap.selectedColor: tabBarMap.color },
          domProps: {innerHTML: item.text}
        }
      )

      const tabBarWrapper = createElement('div', {class: 'tabbar-wrapper'},
      [tabBarMap.list.map((item, index) => {
        return createElement('div', {class: 'tab-item', on: {click: this.itemClickHandler.bind(this, item, index)}},
        [iconImage(item, index), textSpan(item, index)]
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
        cursor pointer
</style>
