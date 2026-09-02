import mpx from '@mpxjs/api-proxy'

function firstHeaderValue (value) {
  const headerValue = Array.isArray(value) ? value[0] : value
  return typeof headerValue === 'string'
    ? headerValue.split(',')[0].trim()
    : ''
}

function createRequestOptions (path, requestContext) {
  const req = requestContext && requestContext.req
  if (!req) {
    return { url: path }
  }

  const headers = req.headers || {}
  const forwardedProtocol = firstHeaderValue(headers['x-forwarded-proto'])
  const requestProtocol = forwardedProtocol || req.protocol ||
    (req.socket && req.socket.encrypted ? 'https' : 'http')
  const protocol = requestProtocol === 'https' ? 'https' : 'http'
  const host = firstHeaderValue(headers['x-forwarded-host']) ||
    firstHeaderValue(headers.host)

  if (!host) {
    throw new Error('Cannot resolve the SSR request origin without a Host header')
  }

  const header = {}
  if (headers.cookie) header.cookie = headers.cookie
  if (headers.authorization) header.authorization = headers.authorization
  if (headers['x-request-id']) header['x-request-id'] = headers['x-request-id']

  return {
    url: new URL(path, `${protocol}://${host}`).toString(),
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
  return request(
    `/api/products/${encodeURIComponent(productId)}/recommendations`,
    requestContext
  )
}
