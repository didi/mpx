import { defineStore } from '@mpxjs/pinia'
import { fetchProduct, fetchRecommendations } from '../services/product'

const pendingLoads = new WeakMap()

export const useProductStore = defineStore('product-platform', {
  state: () => ({
    productId: '',
    product: {},
    recommendations: [],
    loading: false,
    error: null
  }),
  actions: {
    async loadProduct (productId, ssrContext) {
      if (!productId) return

      // Hydration and repeated lifecycle hooks reuse the server result.
      if (String(this.productId) === String(productId) && String(this.product.id) === String(productId) && Array.isArray(this.recommendations)) {
        return { product: this.product, recommendations: this.recommendations }
      }

      const pending = pendingLoads.get(this)
      if (pending && pending.productId === productId) return pending.promise

      // A request belongs to the id it started for. The local sequence prevents
      // a slower navigation from publishing data into the newer product.
      const sequence = (this._loadSequence || 0) + 1
      this._loadSequence = sequence
      this.loading = true
      this.error = null
      const promise = (async () => {
        try {
          const [product, recommendations] = await Promise.all([
          fetchProduct(productId, ssrContext),
          fetchRecommendations(productId, ssrContext)
          ])
          if (sequence !== this._loadSequence) return
          this.productId = productId
          this.product = product || {}
          this.recommendations = recommendations || []
          return { product: this.product, recommendations: this.recommendations }
        } catch (error) {
          if (sequence === this._loadSequence) this.error = error
          throw error
        } finally {
          if (sequence === this._loadSequence) this.loading = false
          const current = pendingLoads.get(this)
          if (current && current.promise === promise) pendingLoads.delete(this)
        }
      })()
      pendingLoads.set(this, { productId, promise })
      return promise
    }
  }
})
