import { defineStore } from '@mpxjs/pinia'
import { fetchArticle } from '../services/article'

export const useArticleStore = defineStore('article', {
  state: () => ({
    article: null,
    recommendations: [],
    currentArticleId: '',
    requestVersion: 0
  }),
  actions: {
    async loadArticle (articleId, requestContext) {
      const id = String(articleId || '')

      if (!id) {
        this.article = null
        this.recommendations = []
        this.currentArticleId = ''
        return
      }

      // Reuse the hydrated result for this exact article only.
      if (this.currentArticleId === id && this.article) return

      this.currentArticleId = id
      const version = ++this.requestVersion
      const data = await fetchArticle(id, requestContext)

      // A newer navigation has started while this request was in flight.
      if (version !== this.requestVersion || id !== this.currentArticleId) return

      this.article = data.article || null
      this.recommendations = Array.isArray(data.recommendations) ? data.recommendations : []
    }
  }
})
