import mpx from '@mpxjs/api-proxy'

function firstHeaderValue (value) {
  return String(value || '').split(',')[0].trim()
}

function requestOrigin (requestContext) {
  const req = requestContext && requestContext.req
  if (!req) return ''

  const headers = req.headers || {}
  const forwardedProtocol = firstHeaderValue(headers['x-forwarded-proto'])
  const forwardedHost = firstHeaderValue(headers['x-forwarded-host'])
  const protocol = forwardedProtocol || req.protocol ||
    (req.socket && req.socket.encrypted ? 'https' : 'http')
  const host = forwardedHost || headers.host

  if (!host) throw new Error('SSR request host is missing')
  return `${protocol}://${host}`
}

function serverHeaders (requestContext) {
  const req = requestContext && requestContext.req
  const headers = req && req.headers ? req.headers : {}
  const result = {}

  if (headers.cookie) result.cookie = headers.cookie
  if (headers.authorization) result.authorization = headers.authorization
  return result
}

function requestJson (path, requestContext) {
  const origin = requestOrigin(requestContext)

  if (origin) {
    return fetch(`${origin}${path}`, {
      headers: serverHeaders(requestContext)
    }).then((response) => {
      if (!response.ok) {
        throw new Error(`Product request failed with status ${response.status}`)
      }
      return response.json()
    })
  }

  return new Promise((resolve, reject) => {
    mpx.request({
      url: path,
      success: ({ data }) => resolve(data),
      fail: reject
    })
  })
}

export function fetchProduct (productId, requestContext) {
  const encodedProductId = encodeURIComponent(productId)
  return requestJson(`/api/products/${encodedProductId}`, requestContext)
}

export function fetchRecommendations (productId, requestContext) {
  const encodedProductId = encodeURIComponent(productId)
  return requestJson(`/api/products/${encodedProductId}/recommendations`, requestContext)
}
