<template>
  <div class="container">
    <div style="background: #f5f5f5;" v-if="small">
      <!-- <Navbar /> -->
      <Content />
      <Footer />
    </div>
    <!-- <template v-else>
      <ParentLayout />
    </template> -->
  </div>
</template>

<script>
import Navbar from "../components/Navbar.vue";
import Content from "../global-components/Content.vue";
import Footer from "../global-components/Footer.vue";
import ParentLayout from '@parent-theme/layouts/Layout.vue'
export default {
  components: {
    Navbar,
    Content,
    Footer,
    ParentLayout
  },
  data () {
    // const current = document.documentElement.clientWidth > 1020
    return {
      small: true
    }
  },
  beforeMount () {
    window.onresize = () => {
      const current = document.documentElement.clientWidth > 1020
      this.small = current
    }
  }
};
</script>

<style lang="stylus" scoped>
</style>