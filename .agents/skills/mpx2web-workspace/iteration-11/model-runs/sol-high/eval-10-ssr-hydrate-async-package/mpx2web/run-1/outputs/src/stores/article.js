import { defineStore } from '@mpxjs/pinia'
import { fetchArticle } from '../services/article'

export const useArticleStore = defineStore('article', {
  state: () => ({
    articleId: '',
    article: null,
    recommendations: [],
    loaded: false,
    requestVersion: 0
  }),
  actions: {
    async loadArticle (articleId, requestContext) {
      const normalizedId = String(articleId || '')
      if (!normalizedId) return
      if (this.loaded && this.articleId === normalizedId) return

      const requestVersion = ++this.requestVersion
      this.articleId = normalizedId
      this.loaded = false

      try {
        const data = await fetchArticle(normalizedId, requestContext)
        if (requestVersion !== this.requestVersion || this.articleId !== normalizedId) return

        this.article = data.article
        this.recommendations = data.recommendations || []
        this.loaded = true
      } catch (error) {
        if (requestVersion === this.requestVersion && this.articleId === normalizedId) {
          this.article = null
          this.recommendations = []
          this.loaded = false
        }
        throw error
      }
    }
  }
})
