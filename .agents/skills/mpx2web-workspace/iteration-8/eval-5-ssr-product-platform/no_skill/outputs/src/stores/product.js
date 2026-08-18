import { defineStore } from '@mpxjs/pinia'
import { fetchProduct, fetchRecommendations } from '../services/product'

export const useProductStore = defineStore('product-platform', {
  state: () => ({
    productId: '',
    product: {},
    recommendations: []
  }),
  actions: {
    loadProduct (productId) {
      if (this.productId === productId) return Promise.resolve(this.product)
      if (this._loadingProductId === productId && this._loadingPromise) return this._loadingPromise

      const requestVersion = (this._requestVersion || 0) + 1
      this._requestVersion = requestVersion
      this._loadingProductId = productId
      this._loadingPromise = Promise.all([
        fetchProduct(productId),
        fetchRecommendations(productId)
      ]).then(([product, recommendations]) => {
        if (this._requestVersion === requestVersion) {
          this.productId = productId
          this.product = product
          this.recommendations = recommendations
        }
        return product
      }).finally(() => {
        if (this._requestVersion === requestVersion) {
          this._loadingProductId = ''
          this._loadingPromise = null
        }
      })
      return this._loadingPromise
    }
  }
})
