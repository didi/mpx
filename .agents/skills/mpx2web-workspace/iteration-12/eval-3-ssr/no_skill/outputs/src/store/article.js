import { defineStore } from '@mpxjs/pinia'
import { fetchArticle } from '../services/article'

export const useArticleStore = defineStore('article', {
  state: () => ({
    article: null,
    loading: true,
    errorText: ''
  }),

  actions: {
    async loadArticle (id) {
      const articleId = id || 'a'

      // SSR state is restored before hydration. Reusing it prevents onLoad
      // from clearing the server-rendered article and issuing a second fetch.
      if (!this.loading && this.article && this.article.id === articleId) {
        return this.article
      }

      this.article = null
      this.loading = true
      this.errorText = ''

      try {
        const article = await fetchArticle(articleId)
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
