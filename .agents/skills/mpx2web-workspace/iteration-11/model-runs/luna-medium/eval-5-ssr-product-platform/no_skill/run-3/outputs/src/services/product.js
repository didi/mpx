import mpx from '@mpxjs/api-proxy'

function requestOrigin (ssrContext) {
  if (typeof window !== 'undefined') return ''
  const req = ssrContext && ssrContext.req
  if (!req) return ''
  const headers = req.headers || {}
  const protocol = (headers['x-forwarded-proto'] || req.protocol || 'http').split(',')[0].trim()
  const host = (headers['x-forwarded-host'] || headers.host || '').split(',')[0].trim()
  return host ? `${protocol}://${host}` : ''
}

function request (path, options = {}) {
  return new Promise((resolve, reject) => {
    mpx.request({
      url: `${requestOrigin(options.ssrContext)}${path}`,
      success: ({ data }) => resolve(data),
      fail: reject
    })
  })
}

export function fetchProduct (productId, options) {
  return request(`/api/products/${encodeURIComponent(productId)}`, options)
}

export function fetchRecommendations (productId, options) {
  return request(`/api/products/${encodeURIComponent(productId)}/recommendations`, options)
}
