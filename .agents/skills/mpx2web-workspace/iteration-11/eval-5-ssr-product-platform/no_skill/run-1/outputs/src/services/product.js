import mpx from '@mpxjs/api-proxy'

function getRequestOrigin (ssrContext) {
  const req = ssrContext && ssrContext.req
  if (!req) return ''

  const headers = req.headers || {}
  const forwardedProto = headers['x-forwarded-proto']
  const protocol = (forwardedProto ? String(forwardedProto).split(',')[0] : (req.protocol || (req.socket && req.socket.encrypted ? 'https' : 'http'))).replace(/:$/, '')
  const host = headers['x-forwarded-host'] || headers.host || req.get && req.get('host')
  return host ? `${protocol}://${String(host).split(',')[0]}` : ''
}

function request (path, ssrContext) {
  const origin = getRequestOrigin(ssrContext)
  return new Promise((resolve, reject) => {
    mpx.request({
      // The browser and mini-program keep using a relative URL. SSR needs an
      // absolute URL because there is no browser origin to resolve it against.
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
