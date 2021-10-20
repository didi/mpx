<template>
  <div id="vuepress-theme-blog__global-layout">
    
    <MobileHeader v-if="isMobile" @toggle-sidebar="isMobile = !isMobile" />
    <Navbar v-else />
    <div class="content-wrapper">
      <DefaultGlobalLayout />
    </div>
  </div>
</template>

<script>
import GlobalLayout from '@app/components/GlobalLayout.vue'
import Navbar from '@theme/components/Navbar.vue'

import MobileHeader from '@theme/components/MobileHeader.vue'

export default {
  components: {
    MobileHeader,

    DefaultGlobalLayout: GlobalLayout,
    Navbar
  },

  data() {
    return {
      isMobileHeaderOpen: false,
      isMobile: document.body.clientWidth < 1020
    }
  },

  // computed: {
  //   isMobile() {
  //     console.log('%c [ document.documentElement.clientWidth ]', 'font-size:13px; background:pink; color:#bf2c9f;', document.documentElement.clientWidth)
  //     return document.documentElement.clientWidth < 1020
  //   }
  // },

  mounted() {
    // this.$router.afterEach(() => {
    //   this.isMobile = false
    // })

    window.onresize = () => {
      const tmp = document.body.clientWidth < 1020
      return this.isMobile = tmp
    }
  },

  // beforeMount () {
  //   window.onresize = () => {
  //     this.isMobile = document.body.clientWidth > 1020
  //     console.log('%c [ his.isMobile ]', 'font-size:13px; background:pink; color:#bf2c9f;', this.isMobile)
  //   }
  // }
}
</script>

<style lang="stylus">
#vuepress-theme-blog__global-layout
  word-wrap break-word

.content-wrapper
  padding 160px 15px 80px 15px
  min-height calc(100vh - 80px - 60px - 160px)
  max-width $contentWidth
  margin 0 auto

  @media (max-width: $MQMobile)
    &
      padding 100px 15px 20px 15px
      min-height calc(100vh - 20px - 60px - 100px)
</style