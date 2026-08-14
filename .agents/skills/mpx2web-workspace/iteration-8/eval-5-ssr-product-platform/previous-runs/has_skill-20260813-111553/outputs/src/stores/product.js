import { defineStore } from '@mpxjs/pinia'
import { fetchProduct, fetchRecommendations } from '../services/product'

export const useProductStore = defineStore('product-platform', {
  state: () => ({
    productId: '',
    product: {},
    recommendations: [],
    loaded: false
  }),
  actions: {
    loadProduct (productId, options = {}) {
      const normalizedProductId = String(productId || '')
      if (!normalizedProductId) return Promise.resolve()
      if (!options.force && this.loaded && this.productId === normalizedProductId) {
        return Promise.resolve()
      }
      if (!options.force && this._loadingProductId === normalizedProductId && this._loadingPromise) {
        return this._loadingPromise
      }

      const requestId = (this._requestId || 0) + 1
      this._requestId = requestId
      this._loadingProductId = normalizedProductId
      this.loaded = false

      const loadingPromise = Promise.all([
        fetchProduct(normalizedProductId),
        fetchRecommendations(normalizedProductId)
      ]).then(([product, recommendations]) => {
        if (requestId !== this._requestId) return
        this.productId = normalizedProductId
        this.product = product
        this.recommendations = recommendations
        this.loaded = true
      }).finally(() => {
        if (requestId === this._requestId) {
          this._loadingProductId = ''
          this._loadingPromise = null
        }
      })

      this._loadingPromise = loadingPromise
      return loadingPromise
    }
  }
})
