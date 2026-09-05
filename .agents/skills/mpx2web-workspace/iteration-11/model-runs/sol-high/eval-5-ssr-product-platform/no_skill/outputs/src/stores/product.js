import { defineStore } from '@mpxjs/pinia'
import { fetchProduct, fetchRecommendations } from '../services/product'

const pendingLoads = new WeakMap()

function normalizeProductId (productId) {
  return productId == null ? '' : String(productId)
}

export const useProductStore = defineStore('product-platform', {
  state: () => ({
    productId: '',
    loadedProductId: '',
    product: {},
    recommendations: [],
    requestVersion: 0,
    loading: false,
    error: null
  }),
  actions: {
    async loadProduct (rawProductId, request) {
      const productId = normalizeProductId(rawProductId)
      if (!productId) return false

      if (this.loadedProductId === productId) {
        this.productId = productId
        return true
      }

      const pending = pendingLoads.get(this)
      if (pending && pending.productId === productId) {
        return pending.promise
      }

      const requestVersion = this.requestVersion + 1
      this.requestVersion = requestVersion
      this.productId = productId
      this.loadedProductId = ''
      this.product = {}
      this.recommendations = []
      this.loading = true
      this.error = null

      const loadPromise = Promise.all([
        fetchProduct(productId, request),
        fetchRecommendations(productId, request)
      ]).then(([product, recommendations]) => {
        if (this.requestVersion !== requestVersion || this.productId !== productId) {
          return false
        }

        this.product = product || {}
        this.recommendations = Array.isArray(recommendations) ? recommendations : []
        this.loadedProductId = productId
        return true
      }).catch((error) => {
        if (this.requestVersion === requestVersion && this.productId === productId) {
          this.error = error
        }
        throw error
      }).finally(() => {
        if (this.requestVersion === requestVersion && this.productId === productId) {
          this.loading = false
        }
        const currentPending = pendingLoads.get(this)
        if (currentPending && currentPending.promise === loadPromise) {
          pendingLoads.delete(this)
        }
      })

      pendingLoads.set(this, { productId, promise: loadPromise })
      return loadPromise
    }
  }
})
