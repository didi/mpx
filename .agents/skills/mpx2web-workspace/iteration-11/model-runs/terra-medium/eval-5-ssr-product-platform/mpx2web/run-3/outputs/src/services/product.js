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

function requestData (path, requestContext) {
  const origin = requestOrigin(requestContext)
  return new Promise((resolve, reject) => {
    mpx.request({
      url: origin ? `${origin}${path}` : path,
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
