import { defineStore } from '@mpxjs/pinia'
import { fetchProduct, fetchRecommendations } from '../services/product'

export const useProductStore = defineStore('product-platform', {
  state: () => ({
    productId: '',
    product: {},
    recommendations: [],
    requestVersion: 0
  }),
  actions: {
    async loadProduct (productId, options = {}) {
      if (!productId) return

      // The SSR payload already contains both resources. Reuse it during hydration.
      if (this.productId === productId && this.product && this.product.id === productId && Array.isArray(this.recommendations)) {
        return { product: this.product, recommendations: this.recommendations }
      }

      const version = ++this.requestVersion
      const [product, recommendations] = await Promise.all([
        fetchProduct(productId, options),
        fetchRecommendations(productId, options)
      ])

      // A slower request for a previous product must never replace the current one.
      if (version !== this.requestVersion) return

      this.productId = productId
      this.product = product
      this.recommendations = recommendations
      return { product, recommendations }
    }
  }
})
