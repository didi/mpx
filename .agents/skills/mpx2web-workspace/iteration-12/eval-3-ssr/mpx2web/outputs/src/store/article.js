import { defineStore } from '@mpxjs/pinia'
import { fetchArticle } from '../services/article'

const useArticleStore = defineStore('article', {
  state: () => ({
    article: null,
    loading: true,
    errorText: ''
  }),
  actions: {
    async loadArticle (id) {
      this.article = null
      this.loading = true
      this.errorText = ''

      try {
        const article = await fetchArticle(id)
        this.article = article
        return article
      } catch (error) {
        this.errorText = error.message
      } finally {
        this.loading = false
      }
    }
  }
})

export default useArticleStore
