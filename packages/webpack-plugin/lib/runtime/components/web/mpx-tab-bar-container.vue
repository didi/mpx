<template>
  <div class="mpx-tab-bar-container">
    <mpx-tab-bar v-show="showTabbar" ref="tabBar" :currentIndex="currentIndex" @change="itemChange"></mpx-tab-bar>
    <keep-alive>
      <component ref="tabBarPage" :is="currentComponent" @hook:activated="updatePageId"></component>
    </keep-alive>
  </div>
</template>

<script>
  import { computed } from 'vue'

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
        pageId: null
      }
    },
    provide () {
      return {
        __pageId: computed(() => this.pageId)
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
      currentComponent () {
        this.pageId = null
      },
      $route: {
        handler (to) {
          this.setCurrentIndex(to.path)
        },
        immediate: true
      }
    },
    methods: {
      updatePageId () {
        // keep-alive 首次挂载（含异步页面）和缓存恢复时均触发 activated。
        this.pageId = this.$refs.tabBarPage.__pageId
      },
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

<style scoped>
.mpx-tab-bar-container {
  width: 100%;
  height: 100%;
}
</style>
