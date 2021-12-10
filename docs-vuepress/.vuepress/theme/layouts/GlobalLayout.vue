<template>
  <div id="vuepress-theme-blog__global-layout">

    <Navbar />
    <div class="content-wrapper">
      <DefaultGlobalLayout />
    </div>
  </div>
</template>

<script>
import GlobalLayout from '@app/components/GlobalLayout.vue'
import Navbar from '@theme/components/Navbar.vue'

export default {
  components: {
    DefaultGlobalLayout: GlobalLayout,
    Navbar
  },

  data() {
    return {
      isMobileHeaderOpen: false
    }
  },

  computed: {
    isMobile() {
      return document.documentElement.clientWidth < 720
    }
  },

  mounted() {
    // this.$router.afterEach(() => {
    //   this.isMobile = false
    // })

    window.onresize = () => {
      const tmp = document.body.clientWidth < 720
      return this.isMobile = tmp
    }
  },
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
