import mpx from '@mpxjs/api-proxy'

function getSsrOrigin (ssrContext) {
  const req = ssrContext && ssrContext.req
  if (!req) return ''

  const headers = req.headers || {}
  const protocol = headers['x-forwarded-proto'] || (req.socket && req.socket.encrypted ? 'https' : 'http')
  const host = headers.host
  if (!host) {
    throw new Error('Cannot build an SSR API URL without the request host')
  }
  return `${protocol}://${host}`
}

function requestUrl (path, ssrContext) {
  const origin = getSsrOrigin(ssrContext)
  return origin ? `${origin}${path}` : path
}

function request (path, ssrContext) {
  return new Promise((resolve, reject) => {
    mpx.request({
      url: requestUrl(path, ssrContext),
      success: ({ data }) => resolve(data),
      fail: reject
    })
  })
}

export function fetchProduct (productId, options = {}) {
  return request(`/api/products/${encodeURIComponent(productId)}`, options.ssrContext)
}

export function fetchRecommendations (productId, options = {}) {
  return request(`/api/products/${encodeURIComponent(productId)}/recommendations`, options.ssrContext)
}
