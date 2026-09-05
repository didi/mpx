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
      const normalizedArticleId = articleId == null ? '' : String(articleId)
      if (!normalizedArticleId) return
      if (this.articleId === normalizedArticleId && this.article) return

      const requestVersion = this.requestVersion + 1
      this.requestVersion = requestVersion
      this.articleId = normalizedArticleId
      this.article = null
      this.recommendations = []

      const data = await fetchArticle(normalizedArticleId, requestContext)
      if (this.requestVersion !== requestVersion || this.articleId !== normalizedArticleId) return data

      this.article = data.article
      this.recommendations = data.recommendations || []
      return data
    }
  }
})
