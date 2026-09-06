import { defineStore } from '@mpxjs/pinia'
import { fetchArticle } from '../services/article'

export const useArticleStore = defineStore('article', {
  state: () => ({
    article: null,
    recommendations: [],
    currentArticleId: '',
    requestVersion: 0
  }),
  actions: {
    async loadArticle (articleId, requestContext) {
      const id = articleId == null ? '' : String(articleId)
      if (!id) {
        this.currentArticleId = ''
        this.article = null
        this.recommendations = []
        this.requestVersion += 1
        return null
      }

      // Reuse the already hydrated result for the same article. This also
      // avoids a client request racing the SSR-prefetched request.
      if (this.currentArticleId === id && this.article) return this.article

      this.currentArticleId = id
      this.article = null
      this.recommendations = []
      const version = ++this.requestVersion
      const data = await fetchArticle(id, requestContext)

      // A late response from a previous article must never replace the page
      // currently being viewed.
      if (version !== this.requestVersion || this.currentArticleId !== id) return null

      this.article = data.article
      this.recommendations = Array.isArray(data.recommendations) ? data.recommendations : []
      return this.article
    }
  }
})
