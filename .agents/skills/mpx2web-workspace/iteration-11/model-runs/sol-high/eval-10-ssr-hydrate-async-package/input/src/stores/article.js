import { defineStore } from '@mpxjs/pinia'
import { fetchArticle } from '../services/article'

export const useArticleStore = defineStore('article', {
  state: () => ({
    article: null,
    recommendations: []
  }),
  actions: {
    async loadArticle (articleId, requestContext) {
      if (this.article) return
      const data = await fetchArticle(articleId, requestContext)
      this.article = data.article
      this.recommendations = data.recommendations
    }
  }
})
