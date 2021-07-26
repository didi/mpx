<template>
  <div class="container">
    <Header slot-key="header" />
    <Content slot-key="content" />
    <Footer slot-key="footer" />
  </div>
</template>

<script>
import Header from "../global-components/Header.vue";
import Content from "../global-components/Content.vue";
import Footer from "../global-components/Footer.vue";

export default {
  components: {
    Header,
    Content,
    Footer
  },
};
</script>

<style lang="stylus" scoped>

</style>
