import mpx from '@mpxjs/api-proxy'

function getRequestOrigin (ssrContext) {
  const request = ssrContext && ssrContext.req
  if (!request) return ''
  const headers = request.headers || {}
  const protocol = (headers['x-forwarded-proto'] || '').split(',')[0] || (request.socket && request.socket.encrypted ? 'https' : 'http')
  const host = (headers['x-forwarded-host'] || '').split(',')[0] || headers.host
  return host ? `${protocol}://${host}` : ''
}

function request (path, ssrContext) {
  const origin = getRequestOrigin(ssrContext)
  return new Promise((resolve, reject) => {
    mpx.request({
      url: `${origin}${path}`,
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
