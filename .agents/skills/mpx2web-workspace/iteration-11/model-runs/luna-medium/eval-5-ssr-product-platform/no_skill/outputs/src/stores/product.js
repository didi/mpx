import { defineStore } from '@mpxjs/pinia'
import { fetchProduct, fetchRecommendations } from '../services/product'

// This map is keyed by a Pinia instance, so concurrent SSR renders cannot share
// either data or an in-flight request. It also deduplicates onLoad/SSR takeover.
const requestsByStore = new WeakMap()

export const useProductStore = defineStore('product-platform', {
  state: () => ({
    productId: '',
    product: {},
    recommendations: [],
    loadedProductId: '',
    requestVersion: 0
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

      const version = ++this.requestVersion
      const request = Promise.all([
        fetchProduct(productId, options),
        fetchRecommendations(productId, options)
      ]).then(([product, recommendations]) => {
        // A late response from an old navigation is never allowed to commit.
        if (version === this.requestVersion) {
          this.productId = productId
          this.product = product || {}
          this.recommendations = recommendations || []
          this.loadedProductId = productId
        }
        return { product, recommendations }
      }).finally(() => requests.delete(productId))

      requests.set(productId, request)
      return request
    }
  }
})
