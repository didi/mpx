<template>
  <div class="container">
    <div v-if="$frontmatter.layout === 'homepageLayout'">
      <Navbar />
      <mobile-view v-if="smallMode"></mobile-view>
      <Content v-else />
      <LayoutBottom/>
      <Footer />
    </div>
    <div v-else>
      <!-- <Navbar /> -->
      <Layout></Layout>
    </div>
  </div>
</template>

<script>
import { watch } from 'vue'
import Navbar from "../components/Navbar.vue";
import MobileView from "../components/MobileView.vue";
import Content from "../global-components/Content.vue";
import Footer from "../global-components/Footer.vue";
import LayoutBottom from '../components/RegisterSW.vue'
import DefaultTheme from 'vitepress/theme'
import { useData } from 'vitepress'

const { Layout } = DefaultTheme
// import ParentLayout from '@parent-theme/layouts/Layout.vue'
export default {
  components: {
    Navbar,
    Content,
    Footer,
    Layout,
    // ParentLayout,
    MobileView,
    LayoutBottom
  },
  data () {
    return {
      smallMode: false,
      isDarkNotHomepage: false
    }
  },
  mounted () {
    const { frontmatter, isDark } = useData()
    // 非首页回到首页，关闭暗色模式
    // 非首页，切换到首页，再切换回来，保持之前非首页的亮暗模式
    watch(() => isDark.value, (value) => {
      if (frontmatter.value.layout === 'homepageLayout') {
        if (value) {
          isDark.value = false
        }
      } else {
        this.isDarkNotHomepage = value
      }
    }, { immediate: true })
    watch(() => frontmatter.value.layout, (val) => {
      if (val === 'homepageLayout') {
        if (isDark.value) {
          isDark.value = false
        }
      } else {
        isDark.value = this.isDarkNotHomepage
      }
    }, { immediate: true })
    
    const MOBILE_DESKTOP_BREAKPOINT = 719
    const handleLinksWrapWidth = () => {
      if (document.documentElement.clientWidth < MOBILE_DESKTOP_BREAKPOINT) {
        this.smallMode = true
      } else {
        this.smallMode = false
      }
    }
    handleLinksWrapWidth()
    window.addEventListener('resize', handleLinksWrapWidth, false)
  },
  methods: {
    toggleSidebar (to) {
      this.isSidebarOpen = typeof to === 'boolean' ? to : !this.isSidebarOpen
      this.$emit('toggle-sidebar', this.isSidebarOpen)
    }
  }
};
</script>

<style lang="stylus" scoped>
</style>
