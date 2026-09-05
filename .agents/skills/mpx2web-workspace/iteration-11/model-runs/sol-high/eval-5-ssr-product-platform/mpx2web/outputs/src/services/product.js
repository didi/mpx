import mpx from '@mpxjs/api-proxy'

function getHeader (headers, name) {
  const value = headers && headers[name]
  return Array.isArray(value) ? value[0] : value
}

function createRequestOptions (path, requestContext) {
  const req = requestContext && requestContext.req
  if (!req) return { url: path }

  const headers = req.headers || {}
  const forwardedProtocol = getHeader(headers, 'x-forwarded-proto')
  const protocol = req.protocol ||
    (forwardedProtocol && forwardedProtocol.split(',')[0].trim()) ||
    (req.socket && req.socket.encrypted ? 'https' : 'http')
  const host = typeof req.get === 'function' ? req.get('host') : getHeader(headers, 'host')

  if (!host) {
    throw new Error('Unable to resolve the current SSR request origin')
  }

  const header = {}
  const cookie = getHeader(headers, 'cookie')
  const authorization = getHeader(headers, 'authorization')
  if (cookie) header.cookie = cookie
  if (authorization) header.authorization = authorization

  return {
    url: `${protocol}://${host}${path}`,
    header
  }
}

function request (path, requestContext) {
  return new Promise((resolve, reject) => {
    mpx.request({
      ...createRequestOptions(path, requestContext),
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
