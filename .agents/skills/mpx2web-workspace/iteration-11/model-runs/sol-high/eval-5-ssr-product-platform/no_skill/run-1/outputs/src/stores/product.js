import { defineStore } from '@mpxjs/pinia'
import { fetchProduct, fetchRecommendations } from '../services/product'

// Pending work is keyed by the concrete store instance. It is deliberately kept
// outside serializable state so promises never leak into the SSR hydration data.
const pendingByStore = new WeakMap()

function pendingLoadsFor (store) {
  let pending = pendingByStore.get(store)
  if (!pending) {
    pending = new Map()
    pendingByStore.set(store, pending)
  }
  return pending
}

export const useProductStore = defineStore('product-platform', {
  state: () => ({
    productId: '',
    loadedProductId: '',
    product: {},
    recommendations: [],
    loadVersion: 0
  }),
  actions: {
    async loadProduct (productId, options = {}) {
      const id = String(productId || '')
      if (!id) return null

      // This state is serialized by SSR. Hydration of the same product therefore
      // takes this branch and does not repeat either request in the browser.
      if (this.productId === id && this.loadedProductId === id) {
        return {
          product: this.product,
          recommendations: this.recommendations
        }
      }

      const pending = pendingLoadsFor(this)
      const existing = pending.get(id)
      if (this.productId === id && existing) return existing.promise

      const version = this.loadVersion + 1
      this.loadVersion = version
      this.productId = id
      this.loadedProductId = ''
      this.product = {}
      this.recommendations = []

      const record = {}
      record.promise = Promise.all([
        fetchProduct(id, options),
        fetchRecommendations(id, options)
      ]).then(([product, recommendations]) => {
        // A response may finish after navigation. Only the latest requested
        // product is allowed to update the visible state.
        if (this.loadVersion !== version || this.productId !== id) return null

        this.product = product || {}
        this.recommendations = recommendations || []
        this.loadedProductId = id
        return {
          product: this.product,
          recommendations: this.recommendations
        }
      }).finally(() => {
        if (pending.get(id) === record) pending.delete(id)
      })

      pending.set(id, record)
      return record.promise
    }
  }
})
