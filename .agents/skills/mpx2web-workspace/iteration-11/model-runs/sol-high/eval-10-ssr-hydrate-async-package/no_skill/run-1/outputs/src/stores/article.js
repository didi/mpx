import { defineStore } from '@mpxjs/pinia'
import { fetchArticle } from '../services/article'

const pendingLoads = new WeakMap()

export const useArticleStore = defineStore('article', {
  state: () => ({
    articleId: '',
    article: null,
    recommendations: [],
    loadVersion: 0
  }),
  actions: {
    async loadArticle (articleId, requestContext) {
      const normalizedId = articleId === undefined || articleId === null
        ? ''
        : String(articleId)

      if (!normalizedId) {
        this.loadVersion += 1
        this.articleId = ''
        this.article = null
        this.recommendations = []
        return null
      }

      if (this.articleId === normalizedId && this.article) {
        return {
          article: this.article,
          recommendations: this.recommendations
        }
      }

      const pending = pendingLoads.get(this)
      if (pending && pending.articleId === normalizedId) return pending.promise

      const version = this.loadVersion + 1
      this.loadVersion = version
      this.articleId = normalizedId
      this.article = null
      this.recommendations = []

      const promise = fetchArticle(normalizedId, requestContext)
        .then((data) => {
          if (this.loadVersion !== version) return null

          this.article = data && data.article ? data.article : null
          this.recommendations = data && Array.isArray(data.recommendations)
            ? data.recommendations
            : []
          return data
        })
        .catch((error) => {
          // An obsolete request must neither overwrite data nor surface after a
          // newer navigation has taken ownership of the store.
          if (this.loadVersion !== version) return null
          throw error
        })
        .finally(() => {
          const current = pendingLoads.get(this)
          if (current && current.version === version) pendingLoads.delete(this)
        })

      pendingLoads.set(this, { articleId: normalizedId, version, promise })
      return promise
    }
  }
})
