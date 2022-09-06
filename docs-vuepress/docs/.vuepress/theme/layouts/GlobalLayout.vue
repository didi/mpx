<template>
  <div id="vuepress-theme-blog__global-layout">
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
  }
}
</script>

<style lang="stylus">

</style>
