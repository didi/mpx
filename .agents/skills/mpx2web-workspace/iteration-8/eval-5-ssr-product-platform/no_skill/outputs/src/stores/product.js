import { defineStore } from '@mpxjs/pinia'
import { fetchProduct, fetchRecommendations } from '../services/product'

export const useProductStore = defineStore('product-platform', {
  state: () => ({
    productId: '',
    product: {},
    recommendations: [],
    loaded: false
  }),
  actions: {
    async loadProduct (productId, req) {
      this.productId = productId
      this.product = {}
      this.recommendations = []
      this.loaded = false

      const [product, recommendations] = await Promise.all([
        fetchProduct(productId, req),
        fetchRecommendations(productId, req)
      ])

      if (this.productId !== productId) return false

      this.product = product
      this.recommendations = recommendations
      this.loaded = true
      return true
    }
  }
})
