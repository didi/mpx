<template>
  <div class="container">
    <div class="wrapper" style="background: #f5f5f5; min-width: 1190px; overflow-x: scroll;" v-if="!small">
      <Header />
      <Content />
      <Footer />
    </div>
    <template v-else>
      <ParentLayout />
    </template>
  </div>
</template>

<script>
import Header from "../global-components/Header.vue";
import Content from "../global-components/Content.vue";
import Footer from "../global-components/Footer.vue";
import ParentLayout from '@parent-theme/layouts/Layout.vue'

export default {
  components: {
    Header,
    Content,
    Footer,
    ParentLayout
  },
  data () {
    // const current = document.documentElement.clientWidth > 1020
    return {
      small: false
    }
  },
  beforeMount () {
    window.onresize = () => {
      function isMobile() {
        return (/phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone|webOS|android/i.test(navigator.userAgent))
      }
      this.small = isMobile()
    }
  }
};
</script>

<style lang="stylus" scoped>
// .wrapper
//   width 1280px
//   margin auto
</style>
