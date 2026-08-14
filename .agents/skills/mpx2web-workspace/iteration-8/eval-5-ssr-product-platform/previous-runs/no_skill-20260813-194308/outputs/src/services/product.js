import mpx from '@mpxjs/api-proxy'

function joinUrl (baseUrl, path) {
  return baseUrl ? `${baseUrl.replace(/\/$/, '')}${path}` : path
}

function request (url, options) {
  return new Promise((resolve, reject) => {
    mpx.request(Object.assign({}, options, {
      url,
      success: ({ data }) => resolve(data),
      fail: reject
    }))
  })
}

export function fetchProduct (productId, baseUrl = '') {
  return request(joinUrl(baseUrl, `/api/products/${encodeURIComponent(productId)}`))
}

export function fetchRecommendations (productId, baseUrl = '') {
  return request(joinUrl(baseUrl, `/api/products/${encodeURIComponent(productId)}/recommendations`))
}

export function addCartItem (data, baseUrl = '') {
  return request(joinUrl(baseUrl, '/api/cart/items'), {
    method: 'POST',
    data
  })
}
