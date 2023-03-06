<template>
  <div>
    <component
      v-show="showTabbar"
      ref="tabBar"
      :currentIndex="currentIndex"
      @change="itemChange"
      :is="currentTabBarComponent"
    ></component>
    <keep-alive>
      <component ref="tabBarPage" :is="currentComponent"></component>
    </keep-alive>
  </div>
</template>

<script>
export default {
  name: 'mpx-tab-bar-container',
  data() {
    return {
      currentIndex: 0 // 当前被选中的tabbar
    }
  },
  computed: {
    components() {
      const components = {
        'mpx-tab-bar': global.__tabBarPagesMap['mpx-tab-bar']
      }
      global.__tabBar.list.forEach(({ pagePath }) => {
        const name = pagePath.replace(/\//g, '-')
        const page = global.__tabBarPagesMap[pagePath]
        if (page) {
          components[name] = page
        } else {
          console.warn(
            `[Mpx runtime warn]: TabBar page path ${pagePath} is not exist in local page map, please check!`
          )
        }
      })
      return components
    },
    showTabbar() {
      return global.__tabBar.isShow
    },
    currentComponent() {
      const index = this.currentIndex
      const tabItem = global.__tabBar.list[index]
      return this.components[tabItem.pagePath.replace(/\//g, '-')]
    },
    currentTabBarComponent() {
      return this.components['mpx-tab-bar']
    }
  },
  watch: {
    $route: {
      handler(to) {
        this.setCurrentIndex(to.path)
      },
      immediate: true
    }
  },
  methods: {
    itemChange(item, index) {
      const mpx = global.__mpx
      if (mpx && mpx.switchTab) {
        const pagePath = '/' + global.__tabBar.list[index].pagePath
        mpx.switchTab({
          url: pagePath
        })
      } else {
        this.currentIndex = index
      }
      this.$refs.tabBarPage &&
        this.$refs.tabBarPage.onTabItemTap &&
        this.$refs.tabBarPage.onTabItemTap(item)
    },
    setCurrentIndex(path) {
      global.__tabBar.list.forEach((item, index) => {
        const pagePath = '/' + item.pagePath
        if (pagePath === path) {
          this.currentIndex = index
        }
      })
    }
  }
}
</script>

