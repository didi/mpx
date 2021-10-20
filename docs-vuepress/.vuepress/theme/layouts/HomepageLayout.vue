<template>
  <div class="container">
    <div class="wrapper" style="background: #f5f5f5; min-width: 1190px; overflow-x: scroll;">
      <div v-if="isMobile">
        <MobileView />
      </div>

      <template v-else>
        <!-- <Header /> -->
        <Content />
        <Footer />
      </template>
    </div>
    <!-- <template v-else>
      <ParentLayout />
    </template> -->
  </div>
</template>

<script>
// import Header from "../global-components/Header.vue";
import Content from "../global-components/Content.vue";
import Footer from "../global-components/Footer.vue";
import ParentLayout from '@parent-theme/layouts/Layout.vue'
import MobileView from "../components/MobileView.vue";

export default {
  components: {
    // Header,
    Content,
    Footer,
    ParentLayout,
    MobileView
  },
  data() {
    return {
      isMobile: document.body.clientWidth < 720
    }
  },
  mounted() {
    console.log('mounted trigger======')
    let that = this
    console.log('%c [ this.isMobile ]', 'font-size:13px; background:pink; color:#bf2c9f;', this.isMobile)
    window.onresize = () => {
      console.log('onresize trigger======')
      const tmp = document.body.clientWidth < 720
      console.log('%c [ tmp ]', 'font-size:13px; background:pink; color:#bf2c9f;', tmp)
      return that.isMobile = tmp
    }
  }
};
</script>

<style lang="stylus" scoped>
// .wrapper
//   width 1280px
//   margin auto
</style>
