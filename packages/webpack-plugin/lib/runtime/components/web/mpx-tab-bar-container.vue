<template>
  <div class="mpx-tab-bar-container">
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
        currentIndex: 0, // 当前被选中的tabbar
        // 必须是对象，因为 provide/inject 只传递引用
        // 当修改 .value 时，inject 端的 computed 会响应式更新
        pageIdState: { value: undefined }
      }
    },
    provide () {
      // 向 custom-tab-bar 提供当前激活页面的 pageId
      return {
        __tabContainerPageId: this.pageIdState
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
      },
      currentComponent: {
        handler () {
          // 当切换到新页面时，更新 pageIdState.value
          this.$nextTick(() => {
            const pageInstance = this.$refs.tabBarPage
            if (pageInstance && pageInstance.__pageId !== undefined) {
              this.pageIdState.value = pageInstance.__pageId
            }
          })
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
<style lang="stylus">
  .mpx-tab-bar-container {
    width: 100%;
    height: 100%;
  }
</style>
