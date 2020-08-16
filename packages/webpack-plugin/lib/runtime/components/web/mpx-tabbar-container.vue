<template>
  <div>
    <custom-tab-bar :current="currentIndex"  @bindchange="itemChange"></custom-tab-bar>
    <keep-alive>
      <component ref="tabBarPage" :is="currentComponent"></component>
    </keep-alive>
  </div>
</template>

<script>
  import Vue from 'vue'
  const tabBarMap = Vue.observable(window.__tabBar)
  const components = {}

  tabBarMap.list.forEach((item) => {
    const componentPath = item.pagePath
    const componentName = item.pagePath.replace('/', '-')
    components[componentName] = require('src/' + componentPath).default
  })
  export default {
    name: 'mpx-tabbar-container',
    data () {
      return {
        currentIndex: 0, // 当前被选中的tabbar
        components: []
      }
    },
    computed: {
      currentComponent () {
        const index = this.currentIndex
        const tabItem = tabBarMap.list[index]
        return tabItem.pagePath.replace('/', '-')
      }
    },
    watch: {
      $route(to, from) {
        this.getCurrentIndex(to.path)
      }
    },
    mounted() {
      const href = window.location.href
      this.getCurrentIndex(href)
    },
    components: components,
    methods: {
      itemChange (item, index) {
        this.currentIndex = index
        this.$refs['tabBarPage'].onTabItemTap && this.$refs['tabBarPage'].onTabItemTap(item)
      },
      getCurrentIndex (judgePath) {
        tabBarMap.list.forEach((item, index) => {
          const componentPath = item.pagePath
          if (judgePath.indexOf(componentPath) > 0) {
            this.currentIndex = index
            tabBarMap.current = index
          }
        })
      }
    }
  }
</script>

<style lang="stylus" rel="stylesheet/stylus">

</style>
