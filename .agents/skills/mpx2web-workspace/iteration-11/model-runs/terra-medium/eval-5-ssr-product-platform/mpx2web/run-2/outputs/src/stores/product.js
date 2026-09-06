import { defineStore } from '@mpxjs/pinia'
import { fetchProduct, fetchRecommendations } from '../services/product'

export const useProductStore = defineStore('product-platform', {
  state: () => ({
    productId: '',
    product: {},
    recommendations: [],
    loaded: false,
    requestVersion: 0,
    pendingProductId: '',
    pendingPromise: null
  }),
  actions: {
    async loadProduct (productId, ssrContext) {
      if (this.loaded && this.productId === productId) return
      if (this.pendingPromise && this.pendingProductId === productId) {
        return this.pendingPromise
      }

      const requestVersion = ++this.requestVersion
      this.productId = productId
      this.loaded = false
      this.product = {}
      this.recommendations = []
      const pendingPromise = Promise.all([
        fetchProduct(productId, ssrContext),
        fetchRecommendations(productId, ssrContext)
      ]).then(([product, recommendations]) => {
        if (requestVersion !== this.requestVersion || this.productId !== productId) return
        this.product = product
        this.recommendations = recommendations
        this.loaded = true
      }).finally(() => {
        if (this.pendingPromise === pendingPromise) {
          this.pendingPromise = null
          this.pendingProductId = ''
        }
      })
      this.pendingProductId = productId
      this.pendingPromise = pendingPromise
      return pendingPromise
    }
  }
})
