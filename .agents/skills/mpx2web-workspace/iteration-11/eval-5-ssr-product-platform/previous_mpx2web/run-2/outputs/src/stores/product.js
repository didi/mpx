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
      const normalizedProductId = String(productId || '')
      if (!normalizedProductId) return false
      if (this.loaded && this.productId === normalizedProductId) return true

      const requestVersion = ++this.requestVersion
      this.productId = normalizedProductId
      this.product = {}
      this.recommendations = []
      this.loaded = false

      try {
        const [product, recommendations] = await Promise.all([
          fetchProduct(normalizedProductId, requestContext),
          fetchRecommendations(normalizedProductId, requestContext)
        ])

        if (
          requestVersion !== this.requestVersion ||
          this.productId !== normalizedProductId
        ) {
          return false
        }

        this.product = product || {}
        this.recommendations = Array.isArray(recommendations) ? recommendations : []
        this.loaded = true
        return true
      } catch (error) {
        if (
          requestVersion !== this.requestVersion ||
          this.productId !== normalizedProductId
        ) {
          return false
        }
        this.product = {}
        this.recommendations = []
        this.loaded = false
        throw error
      }
    }
  }
})
