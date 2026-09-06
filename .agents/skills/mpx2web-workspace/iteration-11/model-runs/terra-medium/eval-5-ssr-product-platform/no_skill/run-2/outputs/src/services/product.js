import mpx from '@mpxjs/api-proxy'

function apiUrl (path, ssrContext) {
  const req = ssrContext && ssrContext.req
  if (!req) return path

  const headers = req.headers || {}
  const forwardedProto = headers['x-forwarded-proto']
  const forwardedHost = headers['x-forwarded-host']
  const protocolValue = Array.isArray(forwardedProto) ? forwardedProto[0] : (forwardedProto || req.protocol || 'http')
  const hostValue = Array.isArray(forwardedHost) ? forwardedHost[0] : (forwardedHost || headers.host || '')
  const protocol = protocolValue.split(',')[0].trim()
  const host = hostValue.split(',')[0].trim()

  // A real Node request supplies Host.  Falling back to the relative URL keeps
  // this service usable in non-HTTP render tests without inventing an origin.
  return host ? `${protocol}://${host}${path}` : path
}

function request (path, ssrContext) {
  return new Promise((resolve, reject) => {
    mpx.request({
      url: apiUrl(path, ssrContext),
      success: ({ data }) => resolve(data),
      fail: reject
    })
  })
}

export function fetchProduct (productId, ssrContext) {
  return request(`/api/products/${encodeURIComponent(productId)}`, ssrContext)
}

export function fetchRecommendations (productId, ssrContext) {
  return request(`/api/products/${encodeURIComponent(productId)}/recommendations`, ssrContext)
}
