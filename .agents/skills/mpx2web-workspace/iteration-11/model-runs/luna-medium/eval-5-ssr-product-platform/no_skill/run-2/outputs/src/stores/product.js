import { defineStore } from '@mpxjs/pinia'
import { fetchProduct, fetchRecommendations } from '../services/product'

export const useProductStore = defineStore('product-platform', {
  state: () => ({
    productId: '',
    product: {},
    recommendations: [],
    loaded: false,
    loading: false
  }),
  actions: {
    async loadProduct (productId, ssrContext) {
      if (!productId) return false
      if (this.loaded && this.productId === productId) return true
      if (this._pendingProductId === productId && this._pendingLoad) return this._pendingLoad

      // The generation belongs to this store instance, so an old response
      // cannot commit after navigation to another product.
      this._loadGeneration = (this._loadGeneration || 0) + 1
      const generation = this._loadGeneration
      this.loading = true
      this._pendingProductId = productId
      this._pendingLoad = Promise.all([
        fetchProduct(productId, ssrContext),
        fetchRecommendations(productId, ssrContext)
      ]).then((results) => {
        if (generation !== this._loadGeneration) return false
        this.productId = productId
        this.product = results[0] || {}
        this.recommendations = results[1] || []
        this.loaded = true
        this.loading = false
        return true
      }).finally(() => {
        if (this._pendingProductId === productId) {
          this._pendingProductId = ''
          this._pendingLoad = null
          this.loading = false
        }
      })

      return this._pendingLoad
    }
  }
})
