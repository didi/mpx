import { defineStore } from '@mpxjs/pinia'
import { fetchProduct, fetchRecommendations } from '../services/product'

export const useProductStore = defineStore('product-platform', {
  state: () => ({
    productId: '',
    product: {},
    recommendations: [],
    loadVersion: 0
  }),
  actions: {
    async loadProduct (productId, options) {
      if (!productId) return
      if (!(options && options.force) && this.productId === productId && this.product.id) return

      const loadVersion = ++this.loadVersion
      const [product, recommendations] = await Promise.all([
        fetchProduct(productId),
        fetchRecommendations(productId)
      ])

      if (loadVersion !== this.loadVersion) return
      this.productId = productId
      this.product = product
      this.recommendations = recommendations
    }
  }
})
