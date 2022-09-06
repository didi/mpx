<template>
  <div class="container">
    <Navbar />
    <mobile-view v-if="smallMode"></mobile-view>
    <Content v-else />
    <Footer />
  </div>
</template>

<script>
import Navbar from "../components/Navbar.vue";
import MobileView from "../components/MobileView.vue";
import Content from "../global-components/Content.vue";
import Footer from "../global-components/Footer.vue";
import ParentLayout from '@parent-theme/layouts/Layout.vue'
export default {
  components: {
    Navbar,
    Content,
    Footer,
    ParentLayout,
    MobileView
  },
  data () {
    return {
      smallMode: false
    }
  },
  mounted () {
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