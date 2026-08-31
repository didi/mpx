import mpx from '@mpxjs/api-proxy'

function firstForwardedValue (value) {
  return Array.isArray(value) ? value[0] : value.split(',')[0].trim()
}

function resolveUrl (path, requestContext) {
  if (!requestContext || !requestContext.req) return path

  const req = requestContext.req
  const headers = req.headers
  const protocol = headers['x-forwarded-proto']
    ? firstForwardedValue(headers['x-forwarded-proto'])
    : req.protocol || (req.socket && req.socket.encrypted ? 'https' : 'http')
  const host = firstForwardedValue(headers['x-forwarded-host'] || headers.host)
  return `${protocol}://${host}${path}`
}

function resolveHeaders (requestContext) {
  if (!requestContext || !requestContext.req) return

  const requestHeaders = requestContext.req.headers
  const headers = {}
  if (requestHeaders.cookie) headers.cookie = requestHeaders.cookie
  if (requestHeaders.authorization) headers.authorization = requestHeaders.authorization
  return headers
}

function request (path, requestContext) {
  return new Promise((resolve, reject) => {
    const options = {
      url: resolveUrl(path, requestContext),
      success: ({ data }) => resolve(data),
      fail: reject
    }
    const headers = resolveHeaders(requestContext)
    if (headers) options.header = headers
    mpx.request(options)
  })
}

export function fetchProduct (productId, requestContext) {
  return request(`/api/products/${encodeURIComponent(productId)}`, requestContext)
}

export function fetchRecommendations (productId, requestContext) {
  return request(`/api/products/${encodeURIComponent(productId)}/recommendations`, requestContext)
}
