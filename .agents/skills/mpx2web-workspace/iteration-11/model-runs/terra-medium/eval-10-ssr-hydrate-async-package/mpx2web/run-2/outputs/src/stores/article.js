import { defineStore } from '@mpxjs/pinia'
import { fetchArticle } from '../services/article'

export const useArticleStore = defineStore('article', {
  state: () => ({
    articleId: '',
    articleLoaded: false,
    requestVersion: 0,
    article: null,
    recommendations: []
  }),
  actions: {
    async loadArticle (articleId, requestContext) {
      if (this.articleLoaded && this.articleId === articleId) return

      const requestVersion = ++this.requestVersion
      this.articleId = articleId
      this.articleLoaded = false
      this.article = null
      this.recommendations = []

      const data = await fetchArticle(articleId, requestContext)

      if (requestVersion !== this.requestVersion || this.articleId !== articleId) return

      this.article = data.article
      this.recommendations = data.recommendations
      this.articleLoaded = true
    }
  }
})
