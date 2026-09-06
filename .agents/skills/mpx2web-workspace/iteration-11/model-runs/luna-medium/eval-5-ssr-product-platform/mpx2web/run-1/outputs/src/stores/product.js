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
      if (this._pendingProductId === productId &&
        this._pendingVersion === this.requestVersion) {
        return this._pendingLoad
      }

      const requestVersion = ++this.requestVersion
      this.productId = productId
      this.loaded = false

      const pendingLoad = Promise.all([
        fetchProduct(productId, requestContext),
        fetchRecommendations(productId, requestContext)
      ]).then(([product, recommendations]) => {
        if (requestVersion !== this.requestVersion || this.productId !== productId) return
        this.product = product
        this.recommendations = recommendations
        this.loaded = true
      }).finally(() => {
        if (this._pendingLoad === pendingLoad) {
          this._pendingLoad = null
          this._pendingProductId = ''
          this._pendingVersion = 0
        }
      })

      this._pendingLoad = pendingLoad
      this._pendingProductId = productId
      this._pendingVersion = requestVersion
      return pendingLoad
    }
  }
})
