<template>
  <div>
    <mpx-tab-bar v-show="showTabbar" ref="tabBar" :currentIndex="currentIndex" @change="itemChange"></mpx-tab-bar>
    <keep-alive>
      <component ref="tabBarPage" :is="currentComponent"></component>
    </keep-alive>
  </div>
</template>

<script>
  const tabBar = global.__tabBar
  const tabBarPagesMap = global.__tabBarPagesMap

  const components = {
    'mpx-tab-bar': tabBarPagesMap['mpx-tab-bar']
  }
  tabBar.list.forEach(({ pagePath }) => {
    const name = pagePath.replace(/\//g, '-')
    const page = tabBarPagesMap[pagePath]
    if (page) {
      components[name] = page
    } else {
      console.warn(`[Mpx runtime warn]: TabBar page path ${pagePath} is not exist in local page map, please check!`)
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
        return tabItem.pagePath.replace(/\//g, '-')
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
        const mpx = global.__mpx
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

