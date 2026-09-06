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
      if (this.loaded && this.productId === productId) return
      if (this._productLoadPromise && this.productId === productId && !this.loaded) {
        return this._productLoadPromise
      }

      const requestVersion = ++this.requestVersion
      this.productId = productId
      this.loaded = false
      this.product = {}
      this.recommendations = []

      const loadPromise = Promise.all([
        fetchProduct(productId, requestContext),
        fetchRecommendations(productId, requestContext)
      ]).then(([product, recommendations]) => {
        if (requestVersion !== this.requestVersion || this.productId !== productId) return
        this.product = product
        this.recommendations = recommendations
        this.loaded = true
      }).finally(() => {
        if (this._productLoadPromise === loadPromise) this._productLoadPromise = null
      })
      this._productLoadPromise = loadPromise
      return loadPromise
    }
  }
})
