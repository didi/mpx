<template>
  <header class="header">
    <h1 class="logo">Mpx</h1>
    <div class="row">
      <div class="header__line"></div>
      <nav class="nav"><a class="nav-link" href="/guide/basic/start.html">指南</a></nav>
      <nav class="nav"><a class="nav-link" href="/api/config.html">API</a></nav>
      <nav class="nav"><a class="nav-link" href="/articles/">文章</a></nav>
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
  background-image url("https://gift-static.hongyibo.com.cn/static/kfpub/3547/logo_color.png")
  background-size 135px 35px
  background-repeat no-repeat
  font-size 0
  width 135px
  height 35px
  margin-right 50px
.nav
  margin-left 50px
.row
  display flex
  align-items center
.header
  padding 40px 0 0 30px
  position relative
  display flex
  align-items center
.nav-link
  color #3A495D
.banner
  position absolute
  right 0
  top 0
.searchBox-wrapper
  position absolute
  right 150px
  z-index 2
.header__line
  height 30px
  opacity 0.1
  border 1px solid #3A495D
</style>