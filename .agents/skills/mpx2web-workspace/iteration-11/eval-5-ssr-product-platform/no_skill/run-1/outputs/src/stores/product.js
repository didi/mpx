import { defineStore } from '@mpxjs/pinia'
import { fetchProduct, fetchRecommendations } from '../services/product'

export const useProductStore = defineStore('product-platform', {
  state: () => ({
    productsById: {},
    recommendationsByProductId: {},
    loadedByProductId: {},
    requestVersionByProductId: {}
  }),
  actions: {
    hasProduct (productId) {
      return this.loadedByProductId[String(productId)] === true
    },

    getProduct (productId) {
      return this.productsById[String(productId)] || {}
    },

    getRecommendations (productId) {
      return this.recommendationsByProductId[String(productId)] || []
    },

    async loadProduct (productId, ssrContext) {
      const key = String(productId)

      // SSR state is hydrated into Pinia, so the first client onLoad reuses it.
      if (this.hasProduct(key)) {
        return {
          product: this.getProduct(key),
          recommendations: this.getRecommendations(key)
        }
      }

      const requestVersion = (this.requestVersionByProductId[key] || 0) + 1
      this.requestVersionByProductId = {
        ...this.requestVersionByProductId,
        [key]: requestVersion
      }

      // The request context is passed through this call only. No module-level request
      // or origin is shared between concurrent Node renders.
      const [product, recommendations] = await Promise.all([
        fetchProduct(key, ssrContext),
        fetchRecommendations(key, ssrContext)
      ])

      // If this id was requested again while the pair was in flight, only the
      // newest pair may update the hydrated cache.
      if (this.requestVersionByProductId[key] !== requestVersion) {
        return { product, recommendations, stale: true }
      }

      // Cache by id. A late response for one product cannot replace another product.
      this.productsById = {
        ...this.productsById,
        [key]: product
      }
      this.recommendationsByProductId = {
        ...this.recommendationsByProductId,
        [key]: recommendations
      }
      this.loadedByProductId = {
        ...this.loadedByProductId,
        [key]: true
      }

      return { product, recommendations }
    }
  }
})
