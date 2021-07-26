<template>
  <header class="row header">
    <h1 class="logo">Mpx</h1>
    <div class="row">
      <nav class="nav"><a href="/guide/basic/start.html">指南</a></nav>
      <nav class="nav"><a href="/api/config.html">API</a></nav>
      <nav class="nav"><a href="/articles/">文章</a></nav>
      <div class="searchBox-wrapper">
        <div class="searchBox"><SearchBox /></div>
      </div>
    </div>
    <img
      class="banner"
      width="60%"
      src="https://dpubstatic.udache.com/static/dpubimg/tKlPfygfIM/banner_bg.png"
      alt="banner"
    />
    <img
      class="banner"
      width="50%"
      src="https://dpubstatic.udache.com/static/dpubimg/U7vbANyvqJ/banner_pic.png"
      alt="banner"
    />
  </header>
</template>

<script>
import SearchBox from '@SearchBox'
export default {
  components: {
    SearchBox
  },
};
</script>

<style lang="stylus" scoped>
.logo
  background-image url("https://dpubstatic.udache.com/static/dpubimg/1ESVodfAED/logo.png")
  background-size contain
  background-repeat no-repeat
  font-size 0
  width 135px
  height 35px
.nav
  margin-left 50px
.row
  display flex
  align-items center
  width 100%
.header
  padding 40px 0 0 30px
  position relative
.banner
  position absolute
  right 0
  top 0
.searchBox-wrapper
  position absolute
  right 200px
  z-index 2
.searchBox
  
  // text-align right
  // margin-right 160px
  // opacity 0.7
</style>