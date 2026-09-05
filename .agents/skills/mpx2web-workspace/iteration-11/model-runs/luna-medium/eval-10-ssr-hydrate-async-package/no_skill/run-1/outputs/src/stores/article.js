import { defineStore } from '@mpxjs/pinia'
import { fetchArticle } from '../services/article'

export const useArticleStore = defineStore('article', {
  state: () => ({
    article: null,
    recommendations: [],
    articleId: '',
    requestSerial: 0
  }),
  actions: {
    async loadArticle (articleId, requestContext) {
      if (!articleId) return null
      if (this.article && this.articleId === articleId) return this.article

      const requestSerial = ++this.requestSerial
      this.articleId = articleId
      this.article = null
      this.recommendations = []

      let data
      try {
        data = await fetchArticle(articleId, requestContext)
      } catch (error) {
        if (requestSerial !== this.requestSerial || this.articleId !== articleId) {
          return null
        }
        throw error
      }
      if (requestSerial !== this.requestSerial || this.articleId !== articleId) {
        return null
      }

      this.article = data.article
      this.recommendations = data.recommendations || []
      return this.article
    }
  }
})
