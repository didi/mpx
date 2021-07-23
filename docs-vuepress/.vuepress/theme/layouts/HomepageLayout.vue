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
    Footer,
  },
};
</script>

<style>
@import "../styles/reset.css";
.container { 
  line-height: 1;
  font-family: "PingFang SC", "STHeitiSC-Light", "Helvetica-Light", arial,sans-serif, "Droid Sans Fallback";
  -webkit-tap-highlight-color: transparent;
  font-size: 14px;
  color: #3a495d;
  width: 100%;
  height: 100%;
}
</style>