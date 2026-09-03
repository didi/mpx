import mpx from '@mpxjs/api-proxy'

function getServerOrigin (ssrContext) {
  const req = ssrContext && ssrContext.req
  if (!req) return ''

  const headers = req.headers || {}
  const forwardedProto = headers['x-forwarded-proto']
  const protocol = (forwardedProto && forwardedProto.split(',')[0].trim()) ||
    (req.protocol || (req.connection && req.connection.encrypted ? 'https' : 'http'))
  const forwardedHost = headers['x-forwarded-host']
  const host = (forwardedHost && forwardedHost.split(',')[0].trim()) || headers.host

  return host ? `${protocol}://${host}` : ''
}

function request (path, ssrContext) {
  const origin = getServerOrigin(ssrContext)
  const headers = ssrContext && ssrContext.req && ssrContext.req.headers
  return new Promise((resolve, reject) => {
    mpx.request({
      // Keep relative URLs in browsers and mini-programs; Node needs the request origin.
      url: origin ? `${origin}${path}` : path,
      header: headers && origin ? { cookie: headers.cookie || '' } : undefined,
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
