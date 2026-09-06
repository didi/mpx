import { defineStore } from '@mpxjs/pinia'
import { fetchArticle } from '../services/article'

export const useArticleStore = defineStore('article', {
  state: () => ({
    articleId: '',
    article: null,
    recommendations: [],
    requestToken: 0
  }),
  actions: {
    async loadArticle (articleId, requestContext) {
      if (!articleId) return
      if (this.articleId === articleId && this.article) return

      const token = this.requestToken + 1
      this.requestToken = token
      this.articleId = articleId
      this.article = null
      this.recommendations = []

      const data = await fetchArticle(articleId, requestContext)
      if (token !== this.requestToken || this.articleId !== articleId) return

      this.article = data.article
      this.recommendations = data.recommendations || []
    }
  }
})
