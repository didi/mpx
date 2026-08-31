import { defineStore } from '@mpxjs/pinia'
import { fetchProduct, fetchRecommendations } from '../services/product'

const requestStates = new WeakMap()

function getRequestState (store) {
  let requestState = requestStates.get(store)
  if (!requestState) {
    requestState = {
      sequence: 0,
      pending: null
    }
    requestStates.set(store, requestState)
  }
  return requestState
}

export const useProductStore = defineStore('product-platform', {
  state: () => ({
    productId: '',
    product: {},
    recommendations: [],
    loaded: false,
    loading: false
  }),
  actions: {
    loadProduct (productId, req) {
      productId = String(productId)
      const requestState = getRequestState(this)

      if (this.loaded && this.productId === productId) {
        return Promise.resolve({
          product: this.product,
          recommendations: this.recommendations
        })
      }
      if (requestState.pending && requestState.pending.productId === productId) {
        return requestState.pending.promise
      }

      const sequence = ++requestState.sequence
      this.productId = productId
      this.product = {}
      this.recommendations = []
      this.loaded = false
      this.loading = true

      const promise = Promise.all([
        fetchProduct(productId, req),
        fetchRecommendations(productId, req)
      ]).then(([product, recommendations]) => {
        if (requestState.sequence === sequence) {
          this.product = product
          this.recommendations = recommendations
          this.loaded = true
          this.loading = false
        }
        if (requestState.pending && requestState.pending.sequence === sequence) {
          requestState.pending = null
        }
        return { product, recommendations }
      }, (error) => {
        if (requestState.sequence === sequence) this.loading = false
        if (requestState.pending && requestState.pending.sequence === sequence) {
          requestState.pending = null
        }
        throw error
      })

      requestState.pending = { productId, sequence, promise }
      return promise
    }
  }
})
