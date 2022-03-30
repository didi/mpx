<!-- doc: https://docsearch.algolia.com/docs/docsearch-v3/ -->
<template>
  <form id="search-form" class="algolia-search-wrapper search-box" role="search">
    <div id="docsearch-container"></div>
  </form>
</template>

<script>
import docsearch from '@docsearch/js'
import '@docsearch/css'
export default {
  props: ['options'],
  mounted () {
    this.initialize()
  },
  methods: {
    initialize () {
    docsearch({
      container: '#docsearch-container',
      appId: 'DZ8S6HN0MP',
      apiKey: '7849f511f78afc4383a81f0137a91c0f',
      indexName: 'mpxjs',
      })
    }
  },
  watch: {
    options (newValue) {
      this.$el.innerHTML = '<div id="docsearch-container"></div>'
      this.initialize(newValue)
    }
  }
}
</script>

<style lang="stylus">
</style>