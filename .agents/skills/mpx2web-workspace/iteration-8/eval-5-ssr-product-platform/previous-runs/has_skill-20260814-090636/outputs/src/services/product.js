import mpx from '@mpxjs/api-proxy'

function getApiOrigin () {
  if (typeof window !== 'undefined' || typeof process === 'undefined') return ''
  return process.env.MALL_API_ORIGIN || ''
}

function request (path, options) {
  if (__mpx_mode__ === 'web') {
    return fetch(`${getApiOrigin()}${path}`, options).then((response) => {
      if (!response.ok) throw new Error(`Product request failed: ${response.status}`)
      return response.json()
    })
  }

  return new Promise((resolve, reject) => {
    mpx.request(Object.assign({
      url: `${getApiOrigin()}${path}`,
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
