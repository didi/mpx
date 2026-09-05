import { defineStore } from '@mpxjs/pinia'
import { fetchProduct, fetchRecommendations } from '../services/product'

// Promise 不进入可序列化 state；WeakMap 以每个 Pinia store 实例隔离 SSR 请求。
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
      const normalizedProductId = String(productId || '')
      if (!normalizedProductId) return Promise.resolve(false)

      if (this.loaded && this.productId === normalizedProductId) {
        return Promise.resolve(true)
      }

      const pendingLoad = pendingLoads.get(this)
      if (
        pendingLoad &&
        pendingLoad.productId === normalizedProductId &&
        pendingLoad.requestVersion === this.requestVersion &&
        this.productId === normalizedProductId
      ) {
        return pendingLoad.promise
      }

      const requestVersion = this.requestVersion + 1
      this.requestVersion = requestVersion
      this.productId = normalizedProductId
      this.loaded = false
      this.product = {}
      this.recommendations = []

      const promise = Promise.all([
        fetchProduct(normalizedProductId, requestContext),
        fetchRecommendations(normalizedProductId, requestContext)
      ]).then(([product, recommendations]) => {
        if (
          this.requestVersion !== requestVersion ||
          this.productId !== normalizedProductId
        ) return false

        this.product = product
        this.recommendations = recommendations
        this.loaded = true
        return true
      }).finally(() => {
        const currentPendingLoad = pendingLoads.get(this)
        if (currentPendingLoad && currentPendingLoad.requestVersion === requestVersion) {
          pendingLoads.delete(this)
        }
      })

      pendingLoads.set(this, {
        productId: normalizedProductId,
        requestVersion,
        promise
      })

      return promise
    }
  }
})
