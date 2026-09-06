import { defineStore } from '@mpxjs/pinia'
import { fetchArticle } from '../services/article'

export const useArticleStore = defineStore('article', {
  state: () => ({
    resourceId: '',
    article: null,
    recommendations: [],
    loaded: false,
    requestVersion: 0
  }),
  actions: {
    async loadArticle (articleId, requestContext) {
      if (this.loaded && this.resourceId === articleId) return

      const requestVersion = ++this.requestVersion
      this.resourceId = articleId
      this.loaded = false
      this.article = null
      this.recommendations = []

      const data = await fetchArticle(articleId, requestContext)
      if (requestVersion !== this.requestVersion || this.resourceId !== articleId) return

      this.article = data.article
      this.recommendations = data.recommendations
      this.loaded = true
    }
  }
})
