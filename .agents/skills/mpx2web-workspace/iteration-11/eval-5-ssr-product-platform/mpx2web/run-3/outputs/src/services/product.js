import mpx from '@mpxjs/api-proxy'

function getHeaderValue (value) {
  if (Array.isArray(value)) return value[0]
  return value && value.split(',')[0].trim()
}

function getRequestUrl (path, requestContext) {
  const req = requestContext && requestContext.req
  if (!req) return path

  const headers = req.headers || {}
  const protocol = getHeaderValue(headers['x-forwarded-proto']) ||
    req.protocol ||
    (req.socket && req.socket.encrypted ? 'https' : 'http')
  const host = getHeaderValue(headers['x-forwarded-host']) || getHeaderValue(headers.host)
  if (!host) throw new Error('SSR request host is required')
  return `${protocol}://${host}${path}`
}

function request (path, requestContext) {
  return new Promise((resolve, reject) => {
    const req = requestContext && requestContext.req
    const options = {
      url: getRequestUrl(path, requestContext),
      success: ({ data }) => resolve(data),
      fail: reject
    }
    if (req) {
      const header = {}
      if (req.headers.cookie) header.cookie = req.headers.cookie
      if (req.headers.authorization) header.authorization = req.headers.authorization
      if (Object.keys(header).length) options.header = header
    }
    mpx.request(options)
  })
}

export function fetchProduct (productId, requestContext) {
  return request(`/api/products/${encodeURIComponent(productId)}`, requestContext)
}

export function fetchRecommendations (productId, requestContext) {
  return request(`/api/products/${encodeURIComponent(productId)}/recommendations`, requestContext)
}
