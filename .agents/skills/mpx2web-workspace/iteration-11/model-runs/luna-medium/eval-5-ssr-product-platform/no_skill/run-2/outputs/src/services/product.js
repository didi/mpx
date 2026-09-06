import mpx from '@mpxjs/api-proxy'

function getOrigin (ssrContext) {
  const req = ssrContext && ssrContext.req
  if (!req) return ''
  const headers = req.headers || {}
  const protocol = headers['x-forwarded-proto'] || req.protocol || 'http'
  const host = headers['x-forwarded-host'] || headers.host
  return host ? `${String(protocol).split(',')[0].trim()}://${String(host).split(',')[0].trim()}` : ''
}

function requestUrl (path, ssrContext) {
  // SSR needs the current request's origin; browser and mini-program keep relative URLs.
  return getOrigin(ssrContext) + path
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

export function fetchProduct (productId, ssrContext) {
  return request(`/api/products/${encodeURIComponent(productId)}`, ssrContext)
}

export function fetchRecommendations (productId, ssrContext) {
  return request(`/api/products/${encodeURIComponent(productId)}/recommendations`, ssrContext)
}
