import { defineStore } from '@mpxjs/pinia'
import { fetchProduct, fetchRecommendations } from '../services/product'

export const useProductStore = defineStore('product-platform', {
  state: () => ({
    productId: '',
    product: {},
    recommendations: [],
    pendingProductId: '',
    pendingRequest: null
  }),
  actions: {
    async loadProduct (productId, ssrContext) {
      const id = String(productId || '')
      if (!id) return

      // Hydrated data for the current route is already complete.
      if (this.productId === id && this.product && this.product.id && !this.pendingRequest) return
      if (this.pendingRequest && this.pendingProductId === id) return this.pendingRequest

      this.pendingProductId = id
      const request = Promise.all([
        fetchProduct(id, ssrContext),
        fetchRecommendations(id, ssrContext)
      ]).then(([product, recommendations]) => {
        // A later navigation owns the state; an old network response may not.
        if (this.pendingProductId === id) {
          this.productId = id
          this.product = product
          this.recommendations = recommendations
        }
        return { product, recommendations }
      }).finally(() => {
        if (this.pendingProductId === id) {
          this.pendingProductId = ''
          this.pendingRequest = null
        }
      })

      this.pendingRequest = request
      return request
    }
  }
})
