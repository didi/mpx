import { defineStore } from '@mpxjs/pinia'
import { fetchArticle } from '../services/article'

const pendingByStore = new WeakMap()

const useArticleStore = defineStore('article', {
  state: () => ({
    article: null,
    loading: true,
    errorText: '',
    activeId: '',
    resolvedId: ''
  }),
  actions: {
    loadArticle (id) {
      const articleId = id || 'a'

      // SSR 注水后客户端 onLoad 会再次进入；已完成的同一资源直接复用。
      if (!this.loading && this.resolvedId === articleId) {
        return Promise.resolve(this.article)
      }

      const pending = pendingByStore.get(this)
      if (pending && pending.id === articleId) return pending.promise

      this.article = null
      this.loading = true
      this.errorText = ''
      this.activeId = articleId

      const record = { id: articleId, promise: null }
      const promise = fetchArticle(articleId)
        .then((article) => {
          if (pendingByStore.get(this) !== record || this.activeId !== articleId) return article
          this.article = article
          this.resolvedId = articleId
          return article
        })
        .catch((error) => {
          if (pendingByStore.get(this) !== record || this.activeId !== articleId) return
          this.errorText = error.message
          this.resolvedId = articleId
        })
        .finally(() => {
          if (pendingByStore.get(this) !== record || this.activeId !== articleId) return
          pendingByStore.delete(this)
          this.loading = false
        })

      record.promise = promise
      pendingByStore.set(this, record)
      return promise
    }
  }
})

export default useArticleStore
