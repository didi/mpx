import { defineStore } from '@mpxjs/pinia'
import { fetchProduct, fetchRecommendations } from '../services/product'

export const useProductStore = defineStore('product-platform', {
  state: () => ({
    productId: '',
    product: {},
    recommendations: []
  }),
  actions: {
    async loadProduct (productId) {
      const [product, recommendations] = await Promise.all([
        fetchProduct(productId),
        fetchRecommendations(productId)
      ])
      this.productId = productId
      this.product = product
      this.recommendations = recommendations
    }
  }
})
