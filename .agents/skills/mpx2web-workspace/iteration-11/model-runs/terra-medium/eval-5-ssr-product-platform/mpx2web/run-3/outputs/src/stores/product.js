import { defineStore } from '@mpxjs/pinia'
import { fetchProduct, fetchRecommendations } from '../services/product'

export const useProductStore = defineStore('product-platform', {
  state: () => ({
    productId: '',
    product: {},
    recommendations: [],
    loaded: false,
    requestVersion: 0
  }),
  actions: {
    async loadProduct (productId, ssrContext) {
      if (this.loaded && this.productId === productId) return

      const requestVersion = ++this.requestVersion
      this.productId = productId
      this.loaded = false
      this.product = {}
      this.recommendations = []

      const [product, recommendations] = await Promise.all([
        fetchProduct(productId, ssrContext),
        fetchRecommendations(productId, ssrContext)
      ])

      if (requestVersion !== this.requestVersion || this.productId !== productId) return
      this.product = product
      this.recommendations = recommendations
      this.loaded = true
    }
  }
})
