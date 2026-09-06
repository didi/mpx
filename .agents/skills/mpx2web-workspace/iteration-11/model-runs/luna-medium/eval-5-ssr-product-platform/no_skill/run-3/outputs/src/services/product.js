import mpx from '@mpxjs/api-proxy'

function requestUrl (path, options) {
  const req = options && (options.req || (options.ssrContext && options.ssrContext.req))
  if (!req) return path

  const headers = req.headers || {}
  const protocol = headers['x-forwarded-proto'] || req.protocol || 'http'
  const host = headers['x-forwarded-host'] || headers.host
  if (!host) throw new Error('SSR product request requires the current request host')
  return `${protocol.split(',')[0].trim()}://${host}${path}`
}

function get (path, options) {
  return new Promise((resolve, reject) => {
    mpx.request({
      url: requestUrl(path, options),
      success: ({ data }) => resolve(data),
      fail: reject
    })
  })
}

export function fetchProduct (productId, options) {
  return get(`/api/products/${encodeURIComponent(productId)}`, options)
}

export function fetchRecommendations (productId, options) {
  return get(`/api/products/${encodeURIComponent(productId)}/recommendations`, options)
}
