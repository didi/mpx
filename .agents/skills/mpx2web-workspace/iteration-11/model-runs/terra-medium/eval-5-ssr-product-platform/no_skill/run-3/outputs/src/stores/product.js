import { defineStore } from '@mpxjs/pinia'
import { fetchProduct, fetchRecommendations } from '../services/product'

export const useProductStore = defineStore('product-platform', {
  state: () => ({
    productId: '',
    product: {},
    recommendations: [],
    _requestId: 0,
    _pendingProductId: '',
    _pendingRequest: null
  }),
  actions: {
    async loadProduct (productId, ssrContext) {
      if (!productId) return false
      // Hydrated SSR state already contains this product, so takeover is silent.
      if (this.productId === productId && this.product && Object.keys(this.product).length) return true
      if (this._pendingProductId === productId && this._pendingRequest) return this._pendingRequest

      const requestId = ++this._requestId
      this._pendingProductId = productId
      const pendingRequest = Promise.all([
        fetchProduct(productId, ssrContext),
        fetchRecommendations(productId, ssrContext)
      ]).then(([product, recommendations]) => {
        // A response for a page the user has already left must not replace it.
        if (requestId !== this._requestId) return false
        this.productId = productId
        this.product = product || {}
        this.recommendations = recommendations || []
        return true
      }).finally(() => {
        if (this._pendingRequest === pendingRequest) {
          this._pendingRequest = null
          this._pendingProductId = ''
        }
      })

      this._pendingRequest = pendingRequest
      return pendingRequest
    }
  }
})
