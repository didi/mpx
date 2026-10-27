import { defineStore } from '@mpxjs/pinia'
import { fetchArticle } from '../services/article'

// 模块只导出定义；实例由当前页面的 Pinia 创建，state 工厂隔离 SSR 请求。
export const useArticleStore = defineStore('article', {
  state: () => ({ article: null, loading: true, errorText: '', loadedId: null }),
  actions: {
    async loadArticle (id) {
      id = String(id || 'a')
      // loadedId 随 SSR state 恢复；同 id 接管不清空正文，不重复请求。
      // wx 保留每次 onLoad 重新加载的原行为；Web 切换 id 仍走完整加载流程。
      if (__mpx_mode__ === 'web' && this.loadedId === id) return this.article
      this.article = null
      this.loading = true
      this.errorText = ''
      this.loadedId = null
      try {
        const article = await fetchArticle(id)
        this.article = article
        this.loadedId = id
        return article
      } catch (error) {
        // 失败渲染原有错误态，不记录成功标记，后续调用仍可重试。
        this.errorText = error.message
      } finally {
        this.loading = false
      }
    }
  }
})
