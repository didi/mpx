import { defineStore } from '@mpxjs/pinia'
import { fetchArticle } from '../services/article'

export const useArticleStore = defineStore('article', {
  state: () => ({
    article: null,
    articleId: '',
    recommendations: [],
    requestGeneration: 0
  }),
  actions: {
    async loadArticle (articleId, requestContext) {
      const id = String(articleId || '')
      if (!id) return null
      if (this.article && this.articleId === id) {
        return { article: this.article, recommendations: this.recommendations }
      }

      // A store is shared by page instances in the browser. Each request gets
      // a generation, so a slower response can never replace a newer article.
      const generation = this.requestGeneration + 1
      this.requestGeneration = generation
      this.articleId = id
      this.article = null
      this.recommendations = []

      const data = await fetchArticle(id, requestContext)
      if (generation !== this.requestGeneration || this.articleId !== id) return null

      this.article = data.article
      this.recommendations = Array.isArray(data.recommendations) ? data.recommendations : []
      return data
    }
  }
})
