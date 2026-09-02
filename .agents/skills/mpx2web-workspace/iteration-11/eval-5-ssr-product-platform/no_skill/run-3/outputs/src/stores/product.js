import { defineStore } from '@mpxjs/pinia'
import { fetchProduct, fetchRecommendations } from '../services/product'

// The WeakMap only deduplicates work inside one store instance. It never carries
// product data between app/SSR-request store instances and is not serialized.
const pendingLoads = new WeakMap()

export const useProductStore = defineStore('product-platform', {
  state: () => ({
    productId: '',
    product: {},
    recommendations: [],
    loaded: false,
    loading: false,
    requestRevision: 0,
    error: ''
  }),
  actions: {
    loadProduct (productId, req) {
      const normalizedId = String(productId || '')
      if (!normalizedId) return Promise.reject(new Error('A product id is required'))

      if (this.loaded && this.productId === normalizedId) {
        return Promise.resolve(true)
      }

      const pending = pendingLoads.get(this)
      if (pending && pending.productId === normalizedId) return pending.promise

      const revision = this.requestRevision + 1
      this.requestRevision = revision
      this.productId = normalizedId
      this.product = {}
      this.recommendations = []
      this.loaded = false
      this.loading = true
      this.error = ''

      const promise = Promise.all([
        fetchProduct(normalizedId, req),
        fetchRecommendations(normalizedId, req)
      ]).then(([product, recommendations]) => {
        if (this.requestRevision !== revision || this.productId !== normalizedId) return false

        this.product = product || {}
        this.recommendations = Array.isArray(recommendations) ? recommendations : []
        this.loaded = true
        this.loading = false
        return true
      }).catch((error) => {
        if (this.requestRevision === revision && this.productId === normalizedId) {
          this.loading = false
          this.loaded = false
          this.error = error && error.message ? error.message : String(error)
        }
        throw error
      }).finally(() => {
        const current = pendingLoads.get(this)
        if (current && current.revision === revision) pendingLoads.delete(this)
      })

      pendingLoads.set(this, { productId: normalizedId, revision, promise })
      return promise
    }
  }
})
