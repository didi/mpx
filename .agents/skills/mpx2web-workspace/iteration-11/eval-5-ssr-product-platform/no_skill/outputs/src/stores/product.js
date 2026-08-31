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
    async loadProduct (productId, req) {
      if (this.loaded && this.productId === productId) return this.product

      const requestVersion = ++this.requestVersion
      this.productId = productId
      this.product = {}
      this.recommendations = []
      this.loaded = false

      let result
      try {
        result = await Promise.all([
          fetchProduct(productId, req),
          fetchRecommendations(productId, req)
        ])
      } catch (error) {
        if (requestVersion !== this.requestVersion) return null
        throw error
      }

      if (requestVersion !== this.requestVersion) return null

      this.product = result[0]
      this.recommendations = result[1]
      this.loaded = true
      return this.product
    }
  }
})
