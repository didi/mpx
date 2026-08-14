import { defineStore } from '@mpxjs/pinia'
import { fetchProduct, fetchRecommendations } from '../services/product'

export const useProductStore = defineStore('product-platform', {
  state: () => ({
    productId: '',
    product: {},
    recommendations: [],
    loaded: false,
    loading: false,
    requestVersion: 0
  }),
  actions: {
    async loadProduct (productId, requestContext) {
      if (this.loaded && this.productId === productId) return true

      const requestVersion = ++this.requestVersion
      this.productId = productId
      this.product = {}
      this.recommendations = []
      this.loaded = false
      this.loading = true

      try {
        const [product, recommendations] = await Promise.all([
          fetchProduct(productId, requestContext),
          fetchRecommendations(productId, requestContext)
        ])

        if (requestVersion !== this.requestVersion || this.productId !== productId) return false
        this.product = product
        this.recommendations = recommendations
        this.loaded = true
        this.loading = false
        return true
      } catch (error) {
        if (requestVersion === this.requestVersion && this.productId === productId) this.loading = false
        throw error
      }
    }
  }
})
