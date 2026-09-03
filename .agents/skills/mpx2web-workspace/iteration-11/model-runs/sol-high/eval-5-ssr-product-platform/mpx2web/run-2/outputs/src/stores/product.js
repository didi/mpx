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
    async loadProduct (productId, requestContext) {
      const normalizedProductId = String(productId)
      if (this.loaded && this.productId === normalizedProductId) {
        return {
          applied: true,
          cached: true,
          product: this.product,
          recommendations: this.recommendations
        }
      }

      const requestVersion = ++this.requestVersion
      this.productId = normalizedProductId
      this.loaded = false
      this.product = {}
      this.recommendations = []

      const [product, recommendations] = await Promise.all([
        fetchProduct(normalizedProductId, requestContext),
        fetchRecommendations(normalizedProductId, requestContext)
      ])

      if (
        requestVersion !== this.requestVersion ||
        this.productId !== normalizedProductId
      ) {
        return { applied: false }
      }

      this.product = product
      this.recommendations = recommendations
      this.loaded = true

      return {
        applied: true,
        cached: false,
        product,
        recommendations
      }
    }
  }
})
