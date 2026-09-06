import { defineStore } from '@mpxjs/pinia'
import { fetchArticle } from '../services/article'

// Pending requests are deliberately outside serialized Pinia state.  A
// WeakMap keeps them scoped to a particular app/store instance (and therefore
// to one SSR request) without leaking them into the hydration payload.
const pendingByStore = new WeakMap()

export const useArticleStore = defineStore('article', {
  state: () => ({
    articlesById: {},
    recommendationsById: {}
  }),
  actions: {
    loadArticle (articleId, requestContext) {
      const id = String(articleId || '')
      if (!id) return Promise.resolve()
      if (this.articlesById[id]) return Promise.resolve()

      let pending = pendingByStore.get(this)
      if (!pending) {
        pending = new Map()
        pendingByStore.set(this, pending)
      }
      if (pending.has(id)) return pending.get(id)

      const request = fetchArticle(id, requestContext)
        .then((data) => {
          // Results are stored under their own id.  Thus a slower request for
          // an old route can only fill its own cache entry and cannot replace
          // the article currently selected by the page.
          this.articlesById[id] = data.article || {}
          this.recommendationsById[id] = Array.isArray(data.recommendations)
            ? data.recommendations
            : []
        })
        .finally(() => {
          pending.delete(id)
        })

      pending.set(id, request)
      return request
    }
  }
})
