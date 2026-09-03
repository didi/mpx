import mpx from '@mpxjs/api-proxy'

function serverBaseUrl (ssrContext) {
  const req = ssrContext && ssrContext.req
  if (!req) return ''

  const forwardedProtocol = req.headers && req.headers['x-forwarded-proto']
  const protocol = (forwardedProtocol || req.protocol || 'http').split(',')[0].trim()
  const host = req.headers && (req.headers['x-forwarded-host'] || req.headers.host)
  if (!host) throw new Error('SSR request host is required to build the product API URL')
  return `${protocol}://${String(host).split(',')[0].trim()}`
}

function request (url, ssrContext) {
  return new Promise((resolve, reject) => {
    mpx.request({
      url: `${serverBaseUrl(ssrContext)}${url}`,
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
