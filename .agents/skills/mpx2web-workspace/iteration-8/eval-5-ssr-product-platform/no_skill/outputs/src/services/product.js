import mpx from '@mpxjs/api-proxy'

function getRequestOrigin (req) {
  if (!req) return ''

  const forwardedProto = req.headers['x-forwarded-proto']
  const forwardedHost = req.headers['x-forwarded-host']
  const protocol = (Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto || '').split(',')[0].trim() || (req.socket && req.socket.encrypted ? 'https' : 'http')
  const host = (Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost || req.headers.host || '').split(',')[0].trim()

  if (!host) throw new Error('Unable to resolve the SSR request origin')
  return `${protocol}://${host}`
}

function request (url, req) {
  return new Promise((resolve, reject) => {
    mpx.request({
      url: `${getRequestOrigin(req)}${url}`,
      success: ({ data }) => resolve(data),
      fail: reject
    })
  })
}

export function fetchProduct (productId, req) {
  return request(`/api/products/${encodeURIComponent(productId)}`, req)
}

export function fetchRecommendations (productId, req) {
  return request(`/api/products/${encodeURIComponent(productId)}/recommendations`, req)
}
