import { defineStore } from '@mpxjs/pinia'
import { fetchProduct, fetchRecommendations } from '../services/product'

export const useProductStore = defineStore('product-platform', {
  state: () => ({
    productId: '',
    product: {},
    recommendations: [],
    loaded: false,
    loading: false,
    error: null
  }),
  actions: {
    async loadProduct (productId, force) {
      const id = String(productId || '')
      if (!id) return
      if (!force && this.loaded && this.productId === id) return
      if (!force && this.loading && this.productId === id && this._loadingPromise) {
        return this._loadingPromise
      }

      const requestId = (this._requestId || 0) + 1
      this._requestId = requestId
      this.productId = id
      this.loading = true
      this.loaded = false
      this.error = null

      const loadingPromise = Promise.all([
        fetchProduct(id),
        fetchRecommendations(id)
      ]).then(([product, recommendations]) => {
        if (this._requestId !== requestId || this.productId !== id) return
        this.product = product
        this.recommendations = recommendations
        this.loaded = true
      }).catch((error) => {
        if (this._requestId === requestId && this.productId === id) {
          this.error = error
        }
        throw error
      }).finally(() => {
        if (this._requestId === requestId && this.productId === id) {
          this.loading = false
          this._loadingPromise = null
        }
      })

      this._loadingPromise = loadingPromise
      return loadingPromise
    }
  }
})
