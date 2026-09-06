import mpx from '@mpxjs/api-proxy'

function requestOrigin (ssrContext) {
  const req = ssrContext && ssrContext.req
  if (!req) return ''

  const headers = req.headers || {}
  const forwardedProtocol = String(headers['x-forwarded-proto'] || '').split(',')[0].trim()
  const forwardedHost = String(headers['x-forwarded-host'] || '').split(',')[0].trim()
  const protocol = forwardedProtocol || (req.socket && req.socket.encrypted ? 'https' : 'http')
  const host = forwardedHost || headers.host
  if (!host) throw new Error('SSR request host is missing')
  return `${protocol}://${host}`
}

function request (path, ssrContext) {
  const origin = requestOrigin(ssrContext)
  return new Promise((resolve, reject) => {
    mpx.request({
      url: origin ? `${origin}${path}` : path,
      success: ({ data }) => resolve(data),
      fail: reject
    })
  })
}

export function fetchProduct (productId, ssrContext) {
  return request(`/api/products/${encodeURIComponent(productId)}`, ssrContext)
}

export function fetchRecommendations (productId, ssrContext) {
  return request(`/api/products/${encodeURIComponent(productId)}/recommendations`, ssrContext)
}
