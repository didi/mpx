import { defineStore } from '@mpxjs/pinia'
import { fetchProduct, fetchRecommendations } from '../services/product'

export const useProductStore = defineStore('product-platform', {
  state: () => ({
    productId: '',
    loadedProductId: '',
    product: {},
    recommendations: [],
    requestVersion: 0
  }),
  actions: {
    async loadProduct (productId, ssrContext) {
      // Hydrated SSR state already contains both first-screen resources.
      if (this.loadedProductId === productId) return

      const requestVersion = ++this.requestVersion
      this.productId = productId
      this.loadedProductId = ''
      this.product = {}
      this.recommendations = []

      const [product, recommendations] = await Promise.all([
        fetchProduct(productId, ssrContext),
        fetchRecommendations(productId, ssrContext)
      ])

      // A later navigation owns the store.  Its data must win even if this
      // request completes afterwards.
      if (this.requestVersion !== requestVersion || this.productId !== productId) return

      this.product = product
      this.recommendations = recommendations
      this.loadedProductId = productId
    }
  }
})
