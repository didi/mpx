import mpx from '@mpxjs/api-proxy'

function firstHeaderValue (value) {
  const header = Array.isArray(value) ? value[0] : value
  return typeof header === 'string' ? header.split(',')[0].trim() : ''
}

function getRequestOrigin (req) {
  if (!req) return ''

  const headers = req.headers || {}
  const forwardedProtocol = firstHeaderValue(headers['x-forwarded-proto'])
  const protocol = forwardedProtocol || req.protocol ||
    ((req.socket && req.socket.encrypted) ? 'https' : 'http')
  const forwardedHost = firstHeaderValue(headers['x-forwarded-host'])
  const host = forwardedHost || firstHeaderValue(headers.host) ||
    firstHeaderValue(headers[':authority'])

  if (!/^(https?|HTTP|HTTPS)$/.test(protocol) || !host || /[\s/\\]/.test(host)) {
    throw new Error('Unable to resolve a safe API origin from the SSR request')
  }

  return `${protocol.toLowerCase()}://${host}`
}

function request (path, req) {
  const origin = getRequestOrigin(req)

  return new Promise((resolve, reject) => {
    mpx.request({
      url: origin ? `${origin}${path}` : path,
      method: 'GET',
      success: ({ data }) => resolve(data),
      fail: reject
    })
  })
}

export function fetchProduct (productId, req) {
  return request(`/api/products/${encodeURIComponent(productId)}`, req)
}

export function fetchRecommendations (productId, req) {
  return request(`/api/products/${encodeURIComponent(productId)}/recommendations`, req)
}
