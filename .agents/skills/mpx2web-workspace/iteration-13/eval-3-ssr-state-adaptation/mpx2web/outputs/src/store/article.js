import { defineStore } from '@mpxjs/pinia'
import { fetchArticle } from '../services/article'

// 这里只定义 store；实例由当前应用的 Pinia 管理，SSR 请求之间互不共享。
export default defineStore('article', {
  state: () => ({ article: null, loading: true, errorText: '' }),
  actions: {
    async loadArticle (id) {
      this.article = null
      this.loading = true
      this.errorText = ''
      try {
        const article = await fetchArticle(id)
        this.article = article
        return article
      } catch (error) {
        this.errorText = error.message
      } finally {
        this.loading = false
      }
    }
  }
})
