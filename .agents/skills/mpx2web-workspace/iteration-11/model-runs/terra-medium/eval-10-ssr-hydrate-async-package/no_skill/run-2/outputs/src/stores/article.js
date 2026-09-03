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
      const id = String(articleId || '')
      if (!id) return
      if (this.articleId === id && this.article) return

      const token = ++this.requestToken
      this.articleId = id
      this.article = null
      this.recommendations = []

      const data = await fetchArticle(id, requestContext)
      // A newer navigation may have started while this request was in flight.
      if (token !== this.requestToken || id !== this.articleId) return

      this.article = data.article || null
      this.recommendations = data.recommendations || []
    }
  }
})
