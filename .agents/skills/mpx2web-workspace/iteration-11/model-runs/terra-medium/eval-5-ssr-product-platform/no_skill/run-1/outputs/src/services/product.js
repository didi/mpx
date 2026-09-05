import mpx from '@mpxjs/api-proxy'

function firstHeaderValue (value) {
  return Array.isArray(value) ? value[0] : value
}

function requestUrl (path, ssrContext) {
  // Browsers and Mini Programs deliberately retain relative API addresses.
  if (!ssrContext || !ssrContext.req) return path

  const req = ssrContext.req
  const headers = req.headers || {}
  const host = firstHeaderValue(headers['x-forwarded-host']) || firstHeaderValue(headers.host)
  const protocol = firstHeaderValue(headers['x-forwarded-proto']) || req.protocol || 'http'

  if (!host) {
    throw new Error('SSR product request requires the current request host')
  }

  return `${protocol.split(',')[0]}://${host}${path}`
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
