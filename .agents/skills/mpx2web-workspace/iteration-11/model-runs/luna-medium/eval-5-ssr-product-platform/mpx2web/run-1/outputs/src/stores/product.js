import { defineStore } from '@mpxjs/pinia'
import { fetchProduct, fetchRecommendations } from '../services/product'

// Kept outside Pinia state so promises are never serialized into SSR state.
const pendingByStore = new WeakMap()

export const useProductStore = defineStore('product-platform', {
  state: () => ({
    productId: '',
    product: {},
    recommendations: [],
    loaded: false,
    requestVersion: 0
  }),
  actions: {
    loadProduct (productId, ssrContext) {
      if (this.loaded && this.productId === productId) return Promise.resolve()

      const pending = pendingByStore.get(this)
      if (pending && pending.productId === productId && pending.version === this.requestVersion) {
        return pending.promise
      }

      const version = ++this.requestVersion
      this.productId = productId
      this.loaded = false
      this.product = {}
      this.recommendations = []

      const promise = Promise.all([
        fetchProduct(productId, ssrContext),
        fetchRecommendations(productId, ssrContext)
      ]).then(([product, recommendations]) => {
        if (version !== this.requestVersion || this.productId !== productId) return
        this.product = product
        this.recommendations = recommendations
        this.loaded = true
      }).finally(() => {
        const current = pendingByStore.get(this)
        if (current && current.version === version) pendingByStore.delete(this)
      })

      pendingByStore.set(this, { productId, version, promise })
      return promise
    }
  }
})
