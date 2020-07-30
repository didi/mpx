<template>
  <div class="mpx-tabbar-container" :class="extClass" :style="wrapperStyle">
    <div class="tabbar-wrapper">
      <div class="tab-item" v-for="(item, index) in list" :key="index" @click.stop="itemClickHandler(item, index)">
        <img class="icon" :src="currentIndex === index ? (item.selectedIconPath || item.iconPath) : item.iconPath" alt="">
        <span class="tab-cell" :style="'color:' + currentIndex === index ? this.selectedColor : ''">{{item.text}}</span>
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'mpx-tabbar',
    props: {
      custom: {
        type: Boolean,
        default: false
      },
      position: {
        type: String,
        validator: (val) => {
          return ['top', 'bottom'].indexOf(val) >= 0
        },
        default: 'bottom'
      },
      extClass: {
        type: String,
        default: ''
      },
      list: {
        type: Array,
        required: true,
        validator: (val) => val && val.length >= 2 && val.length <= 5, // 数组长度至少是两个,最多是五个
        default: []
      },
      current: {
        type: Number,
        default: 0
      },
      bindchange: {
        type: Function,
        default: () => {}
      },
      color: {
        type: String,
        required: true,
        default: ''
      },
      selectedColor: {
        type: String,
        required: true,
        default: ''
      },
      borderStyle: {
        type: String,
        validator: (val) => {
          return ['black', 'white'].indexOf(val) >= 0
        },
        default: 'black'
      },
      backgroundColor: {
        type: String,
        default: '#fff'
      },
    },
    data () {
      return {
        currentIndex: 0 // 当前被选中的tabbar
      }
    },
    computed: {
      wrapperStyle () { // TODO border-top 1px 需要做适配处理
        let style = `background-color: ${this.backgroundColor}; border-top: 1px solid ${this.borderStyle};`
        style += this.position === 'bottom' ? 'bottom: 0;' : 'top: 0;'
        return style
      },
    },
    mounted () {
      this.currentIndex = this.current
    },
    methods: {
      itemClickHandler (item, index) {
        if (this.currentIndex !== index) {
          this.$emit('bindchange', item)
        }
        const router = window.__mpxRouter
        router.push(item.pagePath)
        this.currentIndex = index
      },
      setCurrentTabBar (index) { // 动态设置 tabBar 某一项的内容
        if (index > this.list.length) {
          console.warn('设置选项超出 tabBar 下标')
        }
        this.currentIndex = index
      },
      getTabBar () { // 自定义组件新增 getTabBar 接口，可获取当前页面下的自定义 tabBar 组件实例
        return this.list[this.currentIndex]
      }
    },
  }
</script>

<style lang="stylus" rel="stylesheet/stylus">
  .mpx-tabbar-container
    position: fixed
    left: 0
    right: 0
    width: 100%
    height: 48px // TODO 确认下高度是否需要做成可配置？
    line-height: 48px
    .tabbar-wrapper
      display flex
      align-items center
      .tab-item
        flex 1
        text-align center
</style>
