import mpx from '@mpxjs/api-proxy'

function request (url, ssrContext) {
  const req = ssrContext && ssrContext.req
  const isServer = typeof window === 'undefined'
  let requestUrl = url
  const header = {}

  // Node needs an absolute URL.  The current request supplies the public host,
  // while browsers and mini programs deliberately keep using relative URLs.
  if (isServer && req) {
    const forwardedProto = req.headers && req.headers['x-forwarded-proto']
    const protocol = (forwardedProto ? forwardedProto.split(',')[0] : null) || req.protocol || 'http'
    const host = req.headers && req.headers.host
    if (!host) return Promise.reject(new Error('SSR product request is missing a Host header'))
    requestUrl = `${protocol}://${host}${url}`
    if (req.headers && req.headers.cookie) header.cookie = req.headers.cookie
  }

  return new Promise((resolve, reject) => {
    mpx.request({
      url: requestUrl,
      header,
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
