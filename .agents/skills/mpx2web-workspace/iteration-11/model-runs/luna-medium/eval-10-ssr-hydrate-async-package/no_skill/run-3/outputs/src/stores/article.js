import { defineStore } from '@mpxjs/pinia'
import { fetchArticle } from '../services/article'

export const useArticleStore = defineStore('article', {
  state: () => ({
    article: null,
    recommendations: [],
    activeArticleId: '',
    loadedArticleId: '',
    requestSerial: 0
  }),
  actions: {
    async loadArticle (articleId, requestContext) {
      const id = String(articleId || '')
      if (!id) return
      if (this.loadedArticleId === id && this.article) return

      const requestSerial = ++this.requestSerial
      this.activeArticleId = id
      this.loadedArticleId = ''
      this.article = null
      this.recommendations = []

      try {
        const data = await fetchArticle(id, requestContext)

        // A later navigation owns the store. Never let an older response
        // replace the article currently being viewed.
        if (requestSerial !== this.requestSerial || this.activeArticleId !== id) return

        this.article = data.article
        this.recommendations = data.recommendations || []
        this.loadedArticleId = id
      } catch (error) {
        // Ignore failures from requests that are no longer current; the page
        // has already moved on to another article.
        if (requestSerial !== this.requestSerial || this.activeArticleId !== id) return
        throw error
      }
    }
  }
})
