import { defineStore } from '@mpxjs/pinia'
import { fetchProduct, fetchRecommendations } from '../services/product'

export const useProductStore = defineStore('product-platform', {
  state: () => ({
    productId: '',
    product: {},
    recommendations: [],
    loaded: false,
    requestId: 0
  }),
  actions: {
    async loadProduct (productId, options = {}) {
      if (!options.force && this.loaded && this.productId === productId) {
        return this.product
      }

      const requestId = ++this.requestId
      const [product, recommendations] = await Promise.all([
        fetchProduct(productId, options.baseUrl),
        fetchRecommendations(productId, options.baseUrl)
      ])

      if (requestId === this.requestId) {
        this.productId = productId
        this.product = product
        this.recommendations = recommendations
        this.loaded = true
      }
      return product
    }
  }
})
