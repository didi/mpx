<!-- doc: https://docsearch.algolia.com/docs/docsearch-v3/ -->
<template>
  <form id="search-form" class="algolia-search-wrapper search-box" role="search">
    <div id="docsearch-container"></div>
  </form>
</template>

<script>
import docsearch from '@docsearch/js'
import '@docsearch/css'
import { algoliaTranslations } from "../../theme/translations"

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
        apiKey: 'a34809e24ae1eb13ca3afc255d0a0cef',
        indexName: 'mpxjs',
        translations: algoliaTranslations,
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