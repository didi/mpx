import { defineStore } from '@mpxjs/pinia'
import { fetchArticle } from '../services/article'

export const useArticleStore = defineStore('article', {
  state: () => ({
    articleId: '',
    article: null,
    recommendations: [],
    requestVersion: 0
  }),
  actions: {
    async loadArticle (articleId, requestContext) {
      const normalizedId = articleId == null ? '' : String(articleId)
      if (!normalizedId) return

      if (this.articleId === normalizedId && this.article) {
        return {
          article: this.article,
          recommendations: this.recommendations
        }
      }

      this.articleId = normalizedId
      this.article = null
      this.recommendations = []

      const requestVersion = ++this.requestVersion
      const data = await fetchArticle(normalizedId, requestContext)

      if (requestVersion !== this.requestVersion || this.articleId !== normalizedId) {
        return data
      }

      this.article = data.article
      this.recommendations = Array.isArray(data.recommendations) ? data.recommendations : []
      return data
    }
  }
})
