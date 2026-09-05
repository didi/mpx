import { defineStore } from '@mpxjs/pinia'
import { fetchProduct, fetchRecommendations } from '../services/product'

// Keep results keyed by id. This also makes an accidentally shared store safe for
// concurrent SSR renders: one request never replaces another request's product.
export const useProductStore = defineStore('product-platform', {
  state: () => ({
    products: {},
    recommendationsByProductId: {},
    loadedProductIds: {}
  }),
  actions: {
    hasLoaded (productId) {
      return Boolean(this.loadedProductIds[productId])
    },
    async loadProduct (productId, ssrContext) {
      const [product, recommendations] = await Promise.all([
        fetchProduct(productId, ssrContext),
        fetchRecommendations(productId, ssrContext)
      ])

      this.products[productId] = product
      this.recommendationsByProductId[productId] = recommendations
      this.loadedProductIds[productId] = true
      return { product, recommendations }
    }
  }
})
