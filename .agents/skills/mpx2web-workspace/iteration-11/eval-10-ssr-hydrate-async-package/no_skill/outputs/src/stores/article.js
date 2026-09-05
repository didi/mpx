import { defineStore } from '@mpxjs/pinia'
import { fetchArticle } from '../services/article'

export const useArticleStore = defineStore('article', {
  state: () => ({
    articleId: '',
    article: null,
    recommendations: [],
    requestId: 0
  }),
  actions: {
    async loadArticle (articleId, requestContext) {
      const normalizedArticleId = articleId === undefined || articleId === null
        ? ''
        : String(articleId)

      if (!normalizedArticleId) return

      if (this.articleId === normalizedArticleId && this.article) {
        return {
          article: this.article,
          recommendations: this.recommendations
        }
      }

      const requestId = this.requestId + 1
      this.requestId = requestId
      this.articleId = normalizedArticleId
      this.article = null
      this.recommendations = []

      try {
        const data = await fetchArticle(normalizedArticleId, requestContext)

        if (this.requestId !== requestId || this.articleId !== normalizedArticleId) {
          return
        }

        this.article = data.article
        this.recommendations = Array.isArray(data.recommendations) ? data.recommendations : []
        return data
      } catch (error) {
        if (this.requestId !== requestId || this.articleId !== normalizedArticleId) {
          return
        }

        this.article = null
        this.recommendations = []
        throw error
      }
    }
  }
})
