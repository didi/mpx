import { defineStore } from '@mpxjs/pinia'
import { fetchArticle } from '../services/article'

export const useArticleStore = defineStore('article', {
  state: () => ({
    articleId: '',
    article: null,
    recommendations: []
  }),
  actions: {
    async loadArticle (articleId, requestContext) {
      const id = String(articleId || '')
      const requestId = (this._articleRequestId || 0) + 1
      this._articleRequestId = requestId

      if (this._articleAbortController) this._articleAbortController.abort()
      this._articleAbortController = typeof AbortController === 'undefined'
        ? null
        : new AbortController()

      this.articleId = id
      this.article = null
      this.recommendations = []

      try {
        const data = await fetchArticle(id, requestContext, {
          signal: this._articleAbortController && this._articleAbortController.signal
        })

        // A response may only update the state of the request that started it.
        if (this._articleRequestId === requestId) {
          this.article = data.article || null
          this.recommendations = data.recommendations || []
        }
        return data
      } catch (error) {
        if (this._articleRequestId !== requestId || error.name === 'AbortError') return
        throw error
      } finally {
        if (this._articleRequestId === requestId) this._articleAbortController = null
      }
    }
  }
})
