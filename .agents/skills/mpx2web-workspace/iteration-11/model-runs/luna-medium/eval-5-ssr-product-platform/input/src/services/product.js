import mpx from '@mpxjs/api-proxy'

export function fetchProduct (productId) {
  return new Promise((resolve, reject) => {
    mpx.request({
      url: `http://localhost:3000/api/products/${productId}`,
      success: ({ data }) => resolve(data),
      fail: reject
    })
  })
}

export function fetchRecommendations (productId) {
  return new Promise((resolve, reject) => {
    mpx.request({
      url: `http://localhost:3000/api/products/${productId}/recommendations`,
      success: ({ data }) => resolve(data),
      fail: reject
    })
  })
}
