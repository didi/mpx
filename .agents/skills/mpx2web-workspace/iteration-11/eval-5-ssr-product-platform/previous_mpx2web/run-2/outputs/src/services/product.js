import mpx from '@mpxjs/api-proxy'

function firstHeaderValue (value) {
  return Array.isArray(value) ? value[0] : String(value || '').split(',')[0].trim()
}

function getServerOrigin (requestContext) {
  const req = requestContext && requestContext.req
  if (!req) return ''

  const headers = req.headers || {}
  const protocol = firstHeaderValue(headers['x-forwarded-proto']) ||
    req.protocol ||
    (req.socket && req.socket.encrypted ? 'https' : 'http')
  const host = firstHeaderValue(headers['x-forwarded-host']) ||
    firstHeaderValue(headers.host) ||
    (typeof req.get === 'function' ? req.get('host') : '')

  if (!host) {
    throw new Error('Cannot resolve the SSR request origin without a Host header')
  }

  return `${protocol}://${host}`
}

function getForwardHeaders (requestContext) {
  const req = requestContext && requestContext.req
  if (!req || !req.headers) return undefined

  const header = {}
  const forwardedNames = ['authorization', 'cookie', 'accept-language']
  forwardedNames.forEach((name) => {
    if (req.headers[name] !== undefined) header[name] = req.headers[name]
  })
  return Object.keys(header).length ? header : undefined
}

function requestData (path, requestContext) {
  const origin = getServerOrigin(requestContext)
  const header = getForwardHeaders(requestContext)

  return new Promise((resolve, reject) => {
    mpx.request({
      url: origin ? `${origin}${path}` : path,
      ...(header ? { header } : {}),
      success: ({ data }) => resolve(data),
      fail: reject
    })
  })
}

export function fetchProduct (productId, requestContext) {
  return requestData(`/api/products/${encodeURIComponent(productId)}`, requestContext)
}

export function fetchRecommendations (productId, requestContext) {
  return requestData(`/api/products/${encodeURIComponent(productId)}/recommendations`, requestContext)
}
