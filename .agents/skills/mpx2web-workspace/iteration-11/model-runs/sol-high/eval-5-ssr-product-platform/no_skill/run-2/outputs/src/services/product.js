import mpx from '@mpxjs/api-proxy'

function firstHeaderValue (value) {
  return Array.isArray(value) ? value[0] : String(value || '').split(',')[0].trim()
}

function getServerOrigin (ssrContext) {
  const req = ssrContext && ssrContext.req
  if (!req) return ''

  const headers = req.headers || {}
  const host = firstHeaderValue(headers['x-forwarded-host'] || headers.host)
  if (!host) return ''

  const forwardedProtocol = firstHeaderValue(headers['x-forwarded-proto'])
  const protocol = forwardedProtocol || req.protocol || (req.socket && req.socket.encrypted ? 'https' : 'http')
  return `${protocol}://${host}`
}

function resolveRequestUrl (path, ssrContext) {
  const origin = getServerOrigin(ssrContext)
  return origin ? `${origin}${path}` : path
}

function request (path, ssrContext) {
  return new Promise((resolve, reject) => {
    mpx.request({
      url: resolveRequestUrl(path, ssrContext),
      success: ({ data }) => resolve(data),
      fail: reject
    })
  })
}

export function fetchProduct (productId, ssrContext) {
  const encodedProductId = encodeURIComponent(productId)
  return request(`/api/products/${encodedProductId}`, ssrContext)
}

export function fetchRecommendations (productId, ssrContext) {
  const encodedProductId = encodeURIComponent(productId)
  return request(`/api/products/${encodedProductId}/recommendations`, ssrContext)
}
