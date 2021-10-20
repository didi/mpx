<template>
  <header class="header">
    <div class="head-container">
      <a href="/">
        <div class="logo">mpx</div>
      </a>
      <div class="row">
        <div class="header__line"></div>
        <nav class="nav">
          <a class="nav-link" href="/guide/basic/start.html">指南</a>
        </nav>
        <nav class="nav">
          <a class="nav-link" href="/api/config.html">API</a>
        </nav>
        <nav class="nav"><a class="nav-link" href="/articles/">文章</a></nav>
        <nav class="nav">
          <a
            class="nav-link"
            href="https://github.com/didi/mpx/releases"
            target="_blank"
            rel="noopener noreferrer"
          >
            更新记录
          </a>
        </nav>
        <nav class="nav">
          <a
            class="nav-link"
            href="https://github.com/didi/mpx"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </nav>
        <div class="searchBox-wrapper">
          <div class="searchBox">
            <AlgoliaSearchBox v-if="isAlgoliaSearch" :options="algolia" />
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script>
import SearchBox from "@SearchBox";
import AlgoliaSearchBox from "../components/AlgoliaSearchBox.vue";
export default {
  components: {
    SearchBox,
    AlgoliaSearchBox,
  },
  computed: {
    algolia() {
      return (
        this.$themeLocaleConfig.algolia || this.$site.themeConfig.algolia || {}
      );
    },
    isAlgoliaSearch() {
      return this.algolia && this.algolia.apiKey && this.algolia.indexName;
    },
  },
};
</script>

<style lang="stylus" scoped>
.logo {
  background-image: url('https://dpubstatic.udache.com/static/dpubimg/imdk1FF2QF/logo_color.png');
  background-size: 135px 35px;
  background-repeat: no-repeat;
  font-size: 0;
  width: 135px;
  height: 35px;
  margin-right: 50px;
}

.nav {
  margin-left: 50px;
}

.row {
  display: flex;
  align-items: center;
}

.header {
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 0.5rem 3rem;
  width: 100%;
  height: 3.5rem;
  position: fixed;
  top: 0;
  left: 0;
  backdrop-filter: saturate(180%) blur(1rem);
  background-color: hsla(0, 0%, 100%, 0.8);
  // box-shadow rgb(240 241 242) 0px 2px 8px
}

.head-container {
  width: 100%;
  height: 3.5rem;
  display: flex;
  align-items: center;
  line-height: 2.2rem;
  // justify-content center
}

.nav-link {
  color: #3A495D;
}

.banner {
  position: absolute;
  right: 0;
  top: 0;
}

.searchBox-wrapper {
  position: absolute;
  right: 150px;
  z-index: 2;
}

.header__line {
  height: 33px;
  opacity: 0.1;
  border: 1px solid #3A495D;
}

.header-container {
  position: absolute;
  width: 100%;
}

.header-nav {
  position: relative;
  z-index: 5;
}
</style>