import { defineStore } from '@mpxjs/pinia'
import { fetchProduct, fetchRecommendations } from '../services/product'

const pendingLoads = new WeakMap()

export const useProductStore = defineStore('product-platform', {
  state: () => ({
    productId: '',
    loadedProductId: '',
    loadingProductId: '',
    requestVersion: 0,
    product: {},
    recommendations: []
  }),
  actions: {
    loadProduct (productId, options = {}) {
      const id = String(productId || '')
      if (!id) return Promise.reject(new Error('A product id is required'))

      if (this.productId === id && this.loadedProductId === id) {
        return Promise.resolve(true)
      }

      const pending = pendingLoads.get(this)
      if (this.loadingProductId === id && pending && pending.productId === id) {
        return pending.promise
      }

      const version = this.requestVersion + 1
      this.requestVersion = version
      this.productId = id
      this.loadedProductId = ''
      this.loadingProductId = id
      this.product = {}
      this.recommendations = []

      const promise = (async () => {
        try {
          const [product, recommendations] = await Promise.all([
            fetchProduct(id, options.req),
            fetchRecommendations(id, options.req)
          ])

          if (this.requestVersion !== version || this.productId !== id) return false

          this.product = product || {}
          this.recommendations = Array.isArray(recommendations) ? recommendations : []
          this.loadedProductId = id
          this.loadingProductId = ''
          return true
        } catch (error) {
          if (this.requestVersion !== version || this.productId !== id) return false
          this.loadingProductId = ''
          throw error
        } finally {
          const currentPending = pendingLoads.get(this)
          if (currentPending && currentPending.version === version) {
            pendingLoads.delete(this)
          }
        }
      })()

      pendingLoads.set(this, { productId: id, version, promise })
      return promise
    }
  }
})
