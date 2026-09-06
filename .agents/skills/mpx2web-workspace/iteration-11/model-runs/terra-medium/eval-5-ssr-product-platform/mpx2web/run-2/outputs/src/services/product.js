import mpx from '@mpxjs/api-proxy'

function requestOrigin (ssrContext) {
  const req = ssrContext && ssrContext.req
  if (!req) return ''
  const headers = req.headers || {}
  const host = headers.host
  if (!host) throw new Error('SSR request host is missing')
  const protocol = req.socket && req.socket.encrypted ? 'https' : 'http'
  return `${protocol}://${host}`
}

function requestJson (path, ssrContext) {
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
  return requestJson(`/api/products/${encodeURIComponent(productId)}`, ssrContext)
}

export function fetchRecommendations (productId, ssrContext) {
  return requestJson(`/api/products/${encodeURIComponent(productId)}/recommendations`, ssrContext)
}
