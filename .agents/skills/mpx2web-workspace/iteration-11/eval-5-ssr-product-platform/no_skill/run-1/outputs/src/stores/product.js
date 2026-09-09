import { defineStore } from '@mpxjs/pinia'
import { fetchProduct, fetchRecommendations } from '../services/product'

const pendingByStore = new WeakMap()

export const useProductStore = defineStore('product-platform', {
  state: () => ({
    productId: '',
    product: {},
    recommendations: [],
    loadingProductId: ''
  }),
  actions: {
    async loadProduct (productId, ssrContext) {
      if (!productId) return { product: {}, recommendations: [] }

      if (this.productId === productId && this.product && this.product.id) {
        return { product: this.product, recommendations: this.recommendations }
      }

      // Mark the selection before awaiting anything. A response for an older
      // selection can then never commit after a switch.
      this.loadingProductId = productId
      let requestCache = pendingByStore.get(this)
      if (!requestCache) {
        requestCache = new Map()
        pendingByStore.set(this, requestCache)
      }
      let pending = requestCache.get(productId)
      if (!pending) {
        pending = Promise.all([
          fetchProduct(productId, ssrContext),
          fetchRecommendations(productId, ssrContext)
        ]).then(([product, recommendations]) => ({ product, recommendations }))
        requestCache.set(productId, pending)
      }

      const result = await pending
      // A late result is still useful to its caller, but must not overwrite a
      // newer product selected in this store.
      if (this.loadingProductId === productId) {
        this.productId = productId
        this.product = result.product
        this.recommendations = result.recommendations
      }
      return result
    }
  }
})
