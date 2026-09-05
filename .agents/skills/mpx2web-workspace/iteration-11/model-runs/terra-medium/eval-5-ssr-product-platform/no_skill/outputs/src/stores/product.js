import { defineStore } from '@mpxjs/pinia'
import { fetchProduct, fetchRecommendations } from '../services/product'

export const useProductStore = defineStore('product-platform', {
  state: () => ({
    productId: '',
    product: {},
    recommendations: [],
    _requestVersion: 0
  }),
  actions: {
    async loadProduct (productId, ssrContext) {
      const id = String(productId || '')
      if (!id) return

      // Hydrated SSR state is already authoritative for this product.
      if (this.productId === id && Object.keys(this.product || {}).length) return

      const version = ++this._requestVersion
      this.productId = id
      this.product = {}
      this.recommendations = []
      const [product, recommendations] = await Promise.all([
        fetchProduct(id, ssrContext),
        fetchRecommendations(id, ssrContext)
      ])

      // A slower request for a previous route must never replace newer content.
      if (version !== this._requestVersion) return
      this.product = product || {}
      this.recommendations = recommendations || []
    }
  }
})
