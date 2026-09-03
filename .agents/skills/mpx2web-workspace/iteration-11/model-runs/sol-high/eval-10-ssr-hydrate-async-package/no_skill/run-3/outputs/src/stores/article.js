import { defineStore } from '@mpxjs/pinia'
import { fetchArticle } from '../services/article'

export const useArticleStore = defineStore('article', {
  state: () => ({
    articleId: '',
    article: null,
    recommendations: [],
    requestVersion: 0
  }),
  actions: {
    async loadArticle (articleId, requestContext) {
      const normalizedId = articleId == null ? '' : String(articleId)
      if (!normalizedId) return

      if (this.articleId === normalizedId && this.article) {
        return {
          article: this.article,
          recommendations: this.recommendations
        }
      }

      const requestVersion = this.requestVersion + 1
      this.requestVersion = requestVersion
      this.articleId = normalizedId
      this.article = null
      this.recommendations = []

      const data = await fetchArticle(normalizedId, requestContext)

      // 页面快速切换后，只允许最后一次请求更新共享页面状态。
      if (this.requestVersion !== requestVersion || this.articleId !== normalizedId) return

      this.article = data.article
      this.recommendations = Array.isArray(data.recommendations) ? data.recommendations : []
      return data
    }
  }
})
