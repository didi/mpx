import { defineStore } from '@mpxjs/pinia'
import { fetchProduct, fetchRecommendations } from '../services/product'

// Pending work is keyed by the request-local/client store instance. Promises do
// not enter Pinia state, so SSR serialization stays clean and requests stay isolated.
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
    async loadProduct (productId, requestContext) {
      if (this.loaded && this.productId === productId) return true

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
        if (requestVersion !== this.requestVersion || this.productId !== productId) {
          return false
        }

        this.product = product
        this.recommendations = recommendations
        this.loaded = true
        return true
      }).finally(() => {
        const current = pendingLoads.get(this)
        if (current && current.promise === promise) pendingLoads.delete(this)
      })

      pendingLoads.set(this, { productId, requestVersion, promise })
      return promise
    }
  }
})
