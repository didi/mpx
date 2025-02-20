<template>
  <header class="header">
    <div class="header-menu" v-if="smallMode">
      <a href="/">
        <img style="vertical-align: middle;height: 20px;" src="https://gift-static.hongyibo.com.cn/static/kfpub/3547/logo_color.png" alt="logo">
      </a>
      <div style="display: flex; align-items: center;">
        <AlgoliaSearchBox v-if="isAlgoliaSearch" :options="algolia" />
        <span class="header-menu-icon">
          <img @click="toggleSidebar" style="height: 14px;" src="https://gift-static.hongyibo.com.cn/static/kfpub/3547/y_icon_liebiao.png" alt="menu">
        </span>
      </div>
    </div>
    <div class="head-container" :style="calculateStyle">
      <a href="/" v-if="!smallMode">
        <div class="logo">mpx</div>
      </a>
      <div class="row">
        <div class="header__line" v-if="!smallMode"></div>
        <nav :class="['nav']" v-for="(item, index) in list" :key="index">
          <a class="nav-link" :href="item.link" :target="item.target" :class="[selectedNavIndex === index? 'router-link-active': '']">
            {{item.title}}
            <img v-if="smallMode" width="16" src="https://gift-static.hongyibo.com.cn/static/kfpub/3547/y_icon_jinru.png" alt="arrow">
          </a>
        </nav>
        <div class="searchBox-wrapper" v-if="!smallMode">
          <!-- <SearchBox /> -->
          <div class="searchBox">
            <AlgoliaSearchBox v-if="isAlgoliaSearch" :options="algolia" />
          </div>
        </div>
      </div>
    </div>
    <div @click="toggleSidebar" v-if="isSidebarOpen" class="head-mask"></div>
  </header>
</template>

<script>
import { computed, ref, onMounted, watch } from "vue"
import { useRoute, useRouter, useData } from "vitepress"
import { VPNavBarSearch } from "vitepress/theme"
// import AlgoliaSearchBox from "../components/AlgoliaSearchBox.vue"

export default {
  components: {
    // SearchBox,
    AlgoliaSearchBox: VPNavBarSearch // 首页替换为 local 搜索
  },
  setup() {
    const route = useRoute()
    const { theme } = useData()
    const router = useRouter()
    const isSidebarOpen = ref(false)
    const smallMode = ref(false)
    const selectedNavIndex = ref(null)
    const algolia = ref({})
    const { path } = route
    const list = [
      { title: '指南', link: '/guide/basic/start.html' },
      { title: 'API', link: '/api/' },
      { title: '文章', link: '/articles/' },
      { title: '更新记录', link: 'https://github.com/didi/mpx/releases', target: '_blank'},
      { title: 'GitHub', link: 'https://github.com/didi/mpx', target: '_blank'}
    ]
    const calculateStyle = computed(() => {
      if (path !== '/') {
        return ''
      }
      return isSidebarOpen.value ? 'transform: translateY(0);z-index: 0;display: none' : ''
    })

    const isAlgoliaSearch = computed(() => {
      // local 暂时写死 true
      return true //theme.value.algolia && theme.value.algolia.apiKey && theme.value.algolia.indexName;
    })
    algolia.value = theme.value.algolia

    onMounted(() => {
      const MOBILE_DESKTOP_BREAKPOINT = 719
      const handleLinksWrapWidth = () => {
        if (document.documentElement.clientWidth < MOBILE_DESKTOP_BREAKPOINT) {
          smallMode.value = true
        } else {
          smallMode.value = false
        }
      }
      handleLinksWrapWidth()
      window.addEventListener('resize', handleLinksWrapWidth, false)
      // useRouter().onAfterRouteChanged(() => {
      //   isSidebarOpen.value = false
      // })
      const currentPath = path
      list.forEach((item, index) => {
        if (item.link === currentPath && !item.link.includes('https://')) {
          selectedNavIndex.value = index
        }
      })
      watch(() => route.path, (newVal) => {
        list.forEach((item, index) => {
          if (item.link === newVal && !item.link.includes('https://')) {
            selectedNavIndex.value = index
          }
        })
      })
    })

    const toggleSidebar = (to) => {
      console.log('in this toggle sidebar ____')
      isSidebarOpen.value = typeof to === 'boolean' ? to : !isSidebarOpen.value
      if (path !== '/') {
        this.$emit('toggle-sidebar')
      }
    }

    return {
      isSidebarOpen,
      calculateStyle,
      selectedNavIndex,
      list,
      toggleSidebar,
      smallMode,
      isAlgoliaSearch,
      algolia
    }
  }
};
</script>

<style lang="stylus" scoped>
.logo {
  background-image: url('https://dpubstatic.udache.com/static/dpubimg/imdk1FF2QF/logo_color.png');
  background-size: 135px 35px;
  background-repeat: no-repeat;
  font-size: 0;
  width: 135px;
  height: 35px;
  margin-right: 50px;
}

.nav {
  margin-left: 50px;
}

.row {
  display: flex;
  align-items: center;
}

.header-menu {
  width: 100%;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 101;
  position: fixed;
  left: 0;
  top: 0;
  line-height: 60px;
  padding: 0 16px;
  box-sizing: border-box;
  background: #F6F6F6;
}

.header-menu-icon {
  display: inline-block;
  padding-left: 12px;
}

.head-container {
  width: 100%;
  height: 3.5rem;
  display: flex;
  align-items: center;
  line-height: 2.2rem;
  z-index: 100;
  position: fixed;
  left: 0;
  top: 0;
  backdrop-filter: saturate(180%) blur(1rem);
  background-color: hsla(0, 0%, 100%, 0.8);
  box-shadow rgb(240 241 242) 0px 2px 8px
  padding: 0.5rem 3rem;
  // justify-content center
  box-sizing: content-box;
}

.nav-link {
  color: #3A495D;
  display: flex;
  align-items: center;
  width: 100%;
  justify-content: space-between;
  font-weight: 500;
}

a.router-link-active {
  color: #3eaf7c;
  border-bottom: 2px solid #46bd87;
  margin-bottom: -2px;
}

.banner {
  position: absolute;
  right: 0;
  top: 0;
}

.searchBox-wrapper {
  position: absolute;
  right: 150px;
  z-index: 2;
}

.header__line {
  height: 33px;
  opacity: 0.1;
  border: 1px solid #3A495D;
}

.header-container {
  position: absolute;
  width: 100%;
}

.header-nav {
  position: relative;
  z-index: 5;
}

.head-mask {
  width: 100vw;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 9;
}

@media (max-width: 719px) {
  .head-container {
    width: 100vw;
    max-height: 100vh;
    background: #fff;
    align-items: start;
    padding: 16px 0;
    height: auto;
    top: 60px;
    transform: translateY(-100%);
    transition: transform 0.3s;
  }
  .row {
    flex-direction: column;
    align-items: start;
    width: 100%;
  }
  .nav {
    width: 100%;
    height: 60px;
    line-height: 60px;
    padding: 0 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-sizing: border-box;
    margin: 0;
  }
}
</style>
