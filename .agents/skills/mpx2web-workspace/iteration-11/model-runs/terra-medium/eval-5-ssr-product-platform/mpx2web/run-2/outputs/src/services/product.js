import mpx from '@mpxjs/api-proxy'

function getRequestUrl (path, requestContext) {
  const req = requestContext && requestContext.req
  if (!req) return path

  const headers = req.headers || {}
  const host = headers['x-forwarded-host'] || headers.host
  const forwardedProtocol = headers['x-forwarded-proto']
  const protocol = (forwardedProtocol && forwardedProtocol.split(',')[0]) ||
    (req.socket && req.socket.encrypted ? 'https' : 'http')

  return host ? `${protocol}://${host}${path}` : path
}

function request (path, requestContext) {
  const req = requestContext && requestContext.req
  return new Promise((resolve, reject) => {
    mpx.request({
      url: getRequestUrl(path, requestContext),
      header: req && req.headers,
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
