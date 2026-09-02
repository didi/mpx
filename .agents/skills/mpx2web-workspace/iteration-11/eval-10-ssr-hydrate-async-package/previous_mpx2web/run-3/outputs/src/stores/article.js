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
      const normalizedArticleId = String(articleId || '')
      if (this.loaded && this.articleId === normalizedArticleId) return this.article

      const requestVersion = ++this.requestVersion
      this.articleId = normalizedArticleId
      this.article = null
      this.recommendations = []
      this.loaded = false

      const data = await fetchArticle(normalizedArticleId, requestContext)
      if (requestVersion !== this.requestVersion || this.articleId !== normalizedArticleId) return

      this.article = data.article
      this.recommendations = data.recommendations
      this.loaded = true
      return this.article
    }
  }
})
