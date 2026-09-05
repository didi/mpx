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

      // The hydrated article is already the right first client render.  Avoid
      // replacing it with a second request during hydration.
      if (this.articleId === id && this.article) return this.article

      const token = this.requestToken + 1
      this.requestToken = token
      this.articleId = id
      this.article = null
      this.recommendations = []

      const data = await fetchArticle(id, requestContext)

      // Only the request for the currently selected article may commit.  This
      // prevents a slow previous navigation from overwriting a newer one.
      if (this.requestToken !== token || this.articleId !== id) return null

      this.article = data.article
      this.recommendations = data.recommendations || []
      return this.article
    }
  }
})
