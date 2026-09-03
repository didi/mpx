import { defineStore } from '@mpxjs/pinia'
import { fetchArticle } from '../services/article'

// Request bookkeeping lives outside Pinia state, so controllers/promises are
// never serialized into SSR state or shared by separate SSR app instances.
const requestBookkeeping = new WeakMap()

export const useArticleStore = defineStore('article', {
  state: () => ({
    articleId: '',
    article: null,
    recommendations: []
  }),
  actions: {
    loadArticle (articleId, requestContext) {
      if (!articleId) return Promise.resolve()

      const bookkeeping = requestBookkeeping.get(this) || {}
      if (bookkeeping.articleId === articleId && bookkeeping.promise) {
        return bookkeeping.promise
      }
      if (this.articleId === articleId && this.article) return Promise.resolve()

      this.articleId = articleId
      this.article = null
      this.recommendations = []
      const requestVersion = (bookkeeping.version || 0) + 1
      const next = { articleId, version: requestVersion }
      requestBookkeeping.set(this, next)

      next.promise = fetchArticle(articleId, requestContext).then((data) => {
        const current = requestBookkeeping.get(this)
        if (current === next && this.articleId === articleId) {
          this.article = data.article
          this.recommendations = data.recommendations || []
        }
        return data
      }).finally(() => {
        const current = requestBookkeeping.get(this)
        if (current === next) {
          requestBookkeeping.set(this, { articleId, version: requestVersion })
        }
      })

      return next.promise
    }
  }
})
