import mpx from '@mpxjs/api-proxy'

function getRequestOrigin (requestContext) {
  const req = requestContext && requestContext.req
  if (!req) return ''

  const forwardedProtocol = req.headers && req.headers['x-forwarded-proto']
  const forwardedHost = req.headers && req.headers['x-forwarded-host']
  const protocol = (Array.isArray(forwardedProtocol) ? forwardedProtocol[0] : forwardedProtocol || req.protocol || (req.socket && req.socket.encrypted ? 'https' : 'http')).split(',')[0].trim()
  const requestHost = Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost || (req.headers && req.headers.host)

  if (!requestHost) throw new Error('Unable to resolve the SSR request origin')
  const host = requestHost.split(',')[0].trim()
  return `${protocol}://${host}`
}

function request (path, requestContext) {
  return new Promise((resolve, reject) => {
    mpx.request({
      url: `${getRequestOrigin(requestContext)}${path}`,
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
