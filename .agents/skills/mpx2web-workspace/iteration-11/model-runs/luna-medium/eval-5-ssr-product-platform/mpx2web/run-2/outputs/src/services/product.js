import mpx from '@mpxjs/api-proxy'

function requestUrl (path, requestContext) {
  const req = requestContext && requestContext.req
  if (!req) return path

  const headers = req.headers || {}
  const protocol = req.protocol || headers['x-forwarded-proto'] || (req.socket && req.socket.encrypted ? 'https' : 'http')
  const host = headers.host || req.hostname
  return host ? `${protocol}://${host}${path}` : path
}

function request (path, requestContext) {
  return new Promise((resolve, reject) => {
    mpx.request({
      url: requestUrl(path, requestContext),
      success: ({ data }) => resolve(data),
      fail: reject
    })
  })
}

export function fetchProduct (productId, requestContext) {
  return request(`/api/products/${productId}`, requestContext)
}

export function fetchRecommendations (productId, requestContext) {
  return request(`/api/products/${productId}/recommendations`, requestContext)
}
