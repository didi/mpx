import mpx from '@mpxjs/api-proxy'

function requestOrigin (requestContext) {
  const req = requestContext && requestContext.req
  if (!req) return ''
  const headers = req.headers || {}
  const forwardedProtocol = String(headers['x-forwarded-proto'] || '').split(',')[0].trim()
  const forwardedHost = String(headers['x-forwarded-host'] || '').split(',')[0].trim()
  const protocol = forwardedProtocol || (req.socket && req.socket.encrypted ? 'https' : 'http')
  const host = forwardedHost || headers.host
  if (!host) throw new Error('SSR request host is missing')
  return `${protocol}://${host}`
}

function requestJson (path, requestContext) {
  const origin = requestOrigin(requestContext)
  if (origin && typeof fetch === 'function') {
    return fetch(`${origin}${path}`).then((response) => {
      if (!response.ok) throw new Error(`Request failed: ${response.status}`)
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
  return requestJson(`/api/products/${encodeURIComponent(productId)}`, requestContext)
}

export function fetchRecommendations (productId, requestContext) {
  return requestJson(`/api/products/${encodeURIComponent(productId)}/recommendations`, requestContext)
}
