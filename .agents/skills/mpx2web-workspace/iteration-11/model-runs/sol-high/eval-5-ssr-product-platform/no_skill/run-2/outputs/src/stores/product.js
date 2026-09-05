import { defineStore } from '@mpxjs/pinia'
import { fetchProduct, fetchRecommendations } from '../services/product'

// Promises must not enter serializable Pinia state. Keying by the store instance
// also prevents requests belonging to different SSR app instances from sharing work.
const pendingByStore = new WeakMap()

export const useProductStore = defineStore('product-platform', {
  state: () => ({
    productId: '',
    loadedProductId: '',
    product: {},
    recommendations: [],
    requestVersion: 0,
    error: null
  }),
  actions: {
    async loadProduct (productId, ssrContext) {
      const normalizedProductId = String(productId || '')
      if (!normalizedProductId) return false

      if (this.loadedProductId === normalizedProductId) {
        this.productId = normalizedProductId
        return true
      }

      const pending = pendingByStore.get(this)
      if (pending && pending.productId === normalizedProductId) {
        return pending.promise
      }

      const requestVersion = this.requestVersion + 1
      this.requestVersion = requestVersion
      this.productId = normalizedProductId
      this.loadedProductId = ''
      this.product = {}
      this.recommendations = []
      this.error = null

      const promise = Promise.all([
        fetchProduct(normalizedProductId, ssrContext),
        fetchRecommendations(normalizedProductId, ssrContext)
      ]).then(([product, recommendations]) => {
        if (
          this.requestVersion !== requestVersion ||
          this.productId !== normalizedProductId
        ) {
          return false
        }

        this.product = product || {}
        this.recommendations = recommendations || []
        this.loadedProductId = normalizedProductId
        return true
      }).catch((error) => {
        if (
          this.requestVersion === requestVersion &&
          this.productId === normalizedProductId
        ) {
          this.error = error
        }
        throw error
      }).finally(() => {
        const currentPending = pendingByStore.get(this)
        if (currentPending && currentPending.promise === promise) {
          pendingByStore.delete(this)
        }
      })

      pendingByStore.set(this, {
        productId: normalizedProductId,
        promise
      })
      return promise
    }
  }
})
