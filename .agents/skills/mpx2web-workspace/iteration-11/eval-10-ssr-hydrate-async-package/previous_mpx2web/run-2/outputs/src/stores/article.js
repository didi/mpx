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
      const nextArticleId = String(articleId || '')
      if (!nextArticleId) return
      if (this.loaded && this.articleId === nextArticleId) {
        return {
          article: this.article,
          recommendations: this.recommendations
        }
      }

      const requestVersion = ++this.requestVersion
      this.articleId = nextArticleId
      this.article = null
      this.recommendations = []
      this.loaded = false

      try {
        const data = await fetchArticle(nextArticleId, requestContext)
        if (requestVersion !== this.requestVersion || this.articleId !== nextArticleId) return

        this.article = data.article
        this.recommendations = data.recommendations || []
        this.loaded = true
        return data
      } catch (error) {
        if (requestVersion !== this.requestVersion || this.articleId !== nextArticleId) return
        throw error
      }
    }
  }
})
