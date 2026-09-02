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
      const nextArticleId = String(articleId)
      if (this.loaded && this.articleId === nextArticleId) return

      const requestVersion = ++this.requestVersion
      this.articleId = nextArticleId
      this.loaded = false
      this.article = null
      this.recommendations = []

      const data = await fetchArticle(nextArticleId, requestContext)
      if (requestVersion !== this.requestVersion || this.articleId !== nextArticleId) return

      this.article = data.article
      this.recommendations = data.recommendations
      this.loaded = true
    }
  }
})
