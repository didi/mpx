import { defineStore } from '@mpxjs/pinia'
import { fetchArticle } from '../services/article'

function normalizeArticleId (articleId) {
  return articleId == null ? '' : String(articleId)
}

export const useArticleStore = defineStore('article', {
  state: () => ({
    articleId: '',
    article: null,
    recommendations: [],
    requestVersion: 0
  }),
  actions: {
    async loadArticle (articleId, requestContext) {
      const normalizedId = normalizeArticleId(articleId)

      if (!normalizedId) {
        this.requestVersion += 1
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

      const requestVersion = this.requestVersion + 1
      this.requestVersion = requestVersion
      this.articleId = normalizedId
      this.article = null
      this.recommendations = []

      const data = await fetchArticle(normalizedId, requestContext)

      // 页面快速切换后，只允许最后一次请求更新共享状态。
      if (this.requestVersion !== requestVersion || this.articleId !== normalizedId) {
        return null
      }

      this.article = data && data.article ? data.article : null
      this.recommendations = data && Array.isArray(data.recommendations)
        ? data.recommendations
        : []

      return data
    }
  }
})
