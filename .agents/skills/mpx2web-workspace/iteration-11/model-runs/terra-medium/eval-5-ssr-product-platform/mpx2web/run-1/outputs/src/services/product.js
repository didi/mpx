import mpx from '@mpxjs/api-proxy'

function getServerRequestOptions (requestContext) {
  const req = requestContext && requestContext.req
  if (!req) return {}

  const headers = req.headers || {}
  const forwardedProtocol = headers['x-forwarded-proto']
  const protocol = (Array.isArray(forwardedProtocol) ? forwardedProtocol[0] : forwardedProtocol || req.protocol || 'http').split(',')[0].trim()
  const forwardedHost = headers['x-forwarded-host']
  const host = (Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost || headers.host || '').split(',')[0].trim()
  const header = {}

  if (headers.cookie) header.cookie = headers.cookie
  if (headers.authorization) header.authorization = headers.authorization

  return {
    origin: host ? `${protocol}://${host}` : '',
    header
  }
}

function requestProductApi (path, requestContext) {
  const serverOptions = getServerRequestOptions(requestContext)

  return new Promise((resolve, reject) => {
    mpx.request({
      url: `${serverOptions.origin}${path}`,
      header: serverOptions.header,
      success: ({ data }) => resolve(data),
      fail: reject
    })
  })
}

export function fetchProduct (productId, requestContext) {
  return requestProductApi(`/api/products/${encodeURIComponent(productId)}`, requestContext)
}

export function fetchRecommendations (productId, requestContext) {
  return requestProductApi(`/api/products/${encodeURIComponent(productId)}/recommendations`, requestContext)
}
