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
      if (!articleId || (this.articleId === articleId && this.article)) return

      const requestId = ++this.requestId
      this.articleId = articleId
      this.article = null
      this.recommendations = []

      const data = await fetchArticle(articleId, requestContext)
      if (requestId !== this.requestId || articleId !== this.articleId) return

      this.article = data.article
      this.recommendations = data.recommendations
    }
  }
})
