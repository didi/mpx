import { defineStore } from '@mpxjs/pinia'
import { fetchArticle } from '../services/article'

export const useArticleStore = defineStore('article', {
  state: () => ({
    activeArticleId: '',
    article: null,
    recommendations: [],
    requestSequence: 0
  }),
  actions: {
    async loadArticle (articleId, requestContext) {
      const id = String(articleId || '')

      // Hydrated SSR state already contains this article. Avoid a client-side
      // request racing the hydration render for the same route.
      if (this.activeArticleId === id && this.article) return this.article

      this.activeArticleId = id
      const sequence = ++this.requestSequence
      const data = await fetchArticle(id, requestContext)

      // A slow request for a previous route may finish later; it must not
      // replace the data selected by the latest route.
      if (sequence !== this.requestSequence || this.activeArticleId !== id) return data

      this.article = data.article
      this.recommendations = data.recommendations || []
      return data.article
    }
  }
})
