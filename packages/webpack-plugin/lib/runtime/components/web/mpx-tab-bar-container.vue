<template>
  <div>
    <mpx-tab-bar v-show="showTabbar" ref="tabBar" :currentIndex="currentIndex" @change="itemChange"></mpx-tab-bar>
    <keep-alive>
      <component ref="tabBarPage" :is="currentComponent"></component>
    </keep-alive>
  </div>
</template>

<script>
  const tabBar = window.__tabBar
  const tabBarPagesMap = window.__tabBarPagesMap

  const components = {
    'mpx-tab-bar': tabBarPagesMap['mpx-tab-bar']
  }
  tabBar.list.forEach((item) => {
    const path = item.pagePath
    const name = path.replace('/', '-')
    const page = tabBarPagesMap['/' + path]
    if (page) {
      components[name] = page
    } else {
      console.warn(`[Mpx runtime warn]: TabBar page path ${path} is not exist in local page map, please check!`)
    }
  })

  export default {
    name: 'mpx-tab-bar-container',
    components,
    data () {
      return {
        currentIndex: 0 // 当前被选中的tabbar
      }
    },
    computed: {
      showTabbar () {
        return tabBar.isShow
      },
      currentComponent () {
        const index = this.currentIndex
        const tabItem = tabBar.list[index]
        return tabItem.pagePath.replace('/', '-')
      }
    },
    watch: {
      $route: {
        handler (to) {
          this.setCurrentIndex(to.path)
        },
        immediate: true
      }
    },
    methods: {
      itemChange (item, index) {
        const mpx = window.__mpx
        if (mpx && mpx.switchTab) {
          const pagePath = '/' + tabBar.list[index].pagePath
          mpx.switchTab({
            url: pagePath
          })
        } else {
          this.currentIndex = index
        }
        this.$refs.tabBarPage && this.$refs.tabBarPage.onTabItemTap && this.$refs.tabBarPage.onTabItemTap(item)
      },
      setCurrentIndex (path) {
        tabBar.list.forEach((item, index) => {
          const pagePath = '/' + item.pagePath
          if (pagePath === path) {
            this.currentIndex = index
          }
        })
      }
    }
  }
</script>

