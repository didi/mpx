import { defineStore } from '@mpxjs/pinia'
import { fetchProduct, fetchRecommendations } from '../services/product'

// Promise 不进入可序列化 state。WeakMap 仅按 store 实例去重当前请求，
// SSR 中每个 Pinia/store 实例仍完全隔离。
const pendingLoads = new WeakMap()

export const useProductStore = defineStore('product-platform', {
  state: () => ({
    productId: '',
    product: {},
    recommendations: [],
    loaded: false,
    requestVersion: 0
  }),
  actions: {
    loadProduct (productId, requestContext) {
      productId = String(productId || '')

      // 客户端 hydrate 只在主键与已完成状态同时匹配时复用注水。
      if (this.loaded && this.productId === productId) {
        return Promise.resolve({
          product: this.product,
          recommendations: this.recommendations
        })
      }

      const pending = pendingLoads.get(this)
      if (
        pending &&
        pending.productId === productId &&
        pending.requestVersion === this.requestVersion
      ) {
        return pending.promise
      }

      const requestVersion = ++this.requestVersion
      this.productId = productId
      this.product = {}
      this.recommendations = []
      this.loaded = false

      const promise = Promise.all([
        fetchProduct(productId, requestContext),
        fetchRecommendations(productId, requestContext)
      ]).then(([product, recommendations]) => {
        if (
          requestVersion !== this.requestVersion ||
          this.productId !== productId
        ) return null

        this.product = product
        this.recommendations = recommendations
        this.loaded = true

        return { product, recommendations }
      }).finally(() => {
        const currentPending = pendingLoads.get(this)
        if (currentPending && currentPending.requestVersion === requestVersion) {
          pendingLoads.delete(this)
        }
      })

      pendingLoads.set(this, { productId, requestVersion, promise })
      return promise
    }
  }
})
