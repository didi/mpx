import { defineStore } from '@mpxjs/pinia'
import { fetchProduct, fetchRecommendations } from '../services/product'

// WeakMap keeps in-flight requests isolated per Pinia instance (and therefore
// prevents one concurrent SSR request from deduping against another).
const requestsByStore = new WeakMap()

export const useProductStore = defineStore('product-platform', {
  state: () => ({
    productId: '',
    loadedProductId: '',
    product: {},
    recommendations: []
  }),
  actions: {
    loadProduct (productId, options = {}) {
      if (!productId) return Promise.resolve()
      if (this.loadedProductId === productId) return Promise.resolve()

      let requests = requestsByStore.get(this)
      if (!requests) {
        requests = new Map()
        requestsByStore.set(this, requests)
      }
      if (requests.has(productId)) return requests.get(productId)

      const requestVersion = (this._requestVersion || 0) + 1
      this._requestVersion = requestVersion
      const promise = Promise.all([
        fetchProduct(productId, options),
        fetchRecommendations(productId, options)
      ]).then(([product, recommendations]) => {
        if (this._requestVersion === requestVersion) {
          this.productId = productId
          this.loadedProductId = productId
          this.product = product
          this.recommendations = recommendations
        }
        return { product, recommendations }
      }).finally(() => requests.delete(productId))
      requests.set(productId, promise)
      return promise
    }
  }
})
