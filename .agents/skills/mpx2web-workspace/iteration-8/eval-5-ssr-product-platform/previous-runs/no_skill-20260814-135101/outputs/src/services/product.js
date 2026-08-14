import mpx from '@mpxjs/api-proxy'

function request (path, options) {
  return new Promise((resolve, reject) => {
    mpx.request(Object.assign({
      url: path,
      success: ({ data }) => resolve(data),
      fail: reject
    }, options))
  })
}

export function fetchProduct (productId) {
  return request(`/api/products/${encodeURIComponent(productId)}`)
}

export function fetchRecommendations (productId) {
  return request(`/api/products/${encodeURIComponent(productId)}/recommendations`)
}

export function addCartItem (productId, skuId) {
  return request('/api/cart/items', {
    method: 'POST',
    data: {
      productId,
      skuId
    }
  })
}
