<template>
  <div>
    <mpx-tabbar :current="currentIndex"  @bindchange="itemChange"></mpx-tabbar>
    <component :is="currentComponent"></component>
  </div>
</template>

<script>
  import Vue from 'vue'
  import BScroll from '@better-scroll/core'
  const tabBarMap = Vue.observable(global.__tabBar)
  const components = {}
  if (tabBarMap.custom) {
    components['mpx-tabbar'] = () => import('@mpxjs/webpack-plugin/lib/runtime/components/web/mpx-tabbar.vue')
  } else {
    components['mpx-tabbar'] = () => import('@mpxjs/webpack-plugin/lib/runtime/components/web/mpx-tabbar.vue')
  }

  tabBarMap.list.forEach((item) => {
    const componentPath = item.pagePath
    const componentName = item.pagePath.replace('/', '-')
    components[componentName] = () => import('src/' + componentPath)
  })
  export default {
    name: 'mpx-tabbar-container',
    props: {
    },
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
      },
      getCurrentIndex (judgePath) {
        tabBarMap.list.forEach((item, index) => {
          const componentPath = item.pagePath
          if (judgePath.indexOf(componentPath) > 0) {
            this.currentIndex = index
            global.__tabBar.current = index
          }
        })
      }
    }
  }
</script>

<style lang="stylus" rel="stylesheet/stylus">

</style>
