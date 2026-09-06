import { defineStore } from '@mpxjs/pinia'
import { fetchProduct, fetchRecommendations } from '../services/product'

export const useProductStore = defineStore('product-platform', {
  state: () => ({
    productId: '',
    product: {},
    recommendations: [],
    loadedProductId: '',
    requestVersion: 0
  }),
  actions: {
    async loadProduct (productId, ssrContext) {
      // SSR state is serialized into this request's Pinia instance.  Reusing it
      // on hydration avoids fetching the same product a second time.
      if (this.loadedProductId === productId) return

      const version = ++this.requestVersion
      const [product, recommendations] = await Promise.all([
        fetchProduct(productId, ssrContext),
        fetchRecommendations(productId, ssrContext)
      ])

      // Keep product and recommendations atomic and ignore an obsolete route.
      if (version !== this.requestVersion) return
      this.productId = productId
      this.product = product
      this.recommendations = recommendations
      this.loadedProductId = productId
    }
  }
})
