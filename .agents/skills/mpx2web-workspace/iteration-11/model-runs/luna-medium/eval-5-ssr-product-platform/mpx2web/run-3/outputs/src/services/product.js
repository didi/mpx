import mpx from '@mpxjs/api-proxy'

function requestUrl (path, requestContext) {
  const req = requestContext && requestContext.req
  if (!req) return path

  const headers = req.headers || {}
  const forwardedProtocol = headers['x-forwarded-proto']
  const protocol = forwardedProtocol
    ? String(forwardedProtocol).split(',')[0].trim()
    : (req.protocol || (req.socket && req.socket.encrypted ? 'https' : 'http'))
  const host = headers.host || req.headers && req.headers.Host
  return host ? `${protocol}://${host}${path}` : path
}

function request (url, requestContext) {
  return new Promise((resolve, reject) => {
    mpx.request({
      url: requestUrl(url, requestContext),
      success: ({ data }) => resolve(data),
      fail: reject
    })
  })
}

export function fetchProduct (productId, requestContext) {
  return request(`/api/products/${encodeURIComponent(productId)}`, requestContext)
}

export function fetchRecommendations (productId, requestContext) {
  return request(`/api/products/${encodeURIComponent(productId)}/recommendations`, requestContext)
}
