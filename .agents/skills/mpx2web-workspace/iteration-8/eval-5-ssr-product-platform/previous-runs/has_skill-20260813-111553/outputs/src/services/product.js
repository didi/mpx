import mpx from '@mpxjs/api-proxy'

const API_BASE = '/api'

function request (url, options) {
  return new Promise((resolve, reject) => {
    mpx.request(Object.assign({}, options, {
      url: `${API_BASE}${url}`,
      success: ({ data }) => resolve(data),
      fail: reject
    }))
  })
}

export function fetchProduct (productId) {
  return request(`/products/${encodeURIComponent(productId)}`)
}

export function fetchRecommendations (productId) {
  return request(`/products/${encodeURIComponent(productId)}/recommendations`)
}

export function addCartItem (productId, skuId) {
  return request('/cart/items', {
    method: 'POST',
    data: {
      productId,
      skuId
    }
  })
}
