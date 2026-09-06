import mpx from '@mpxjs/api-proxy'

function getRequestUrl (path, ssrContext) {
  const req = ssrContext && ssrContext.req

  // Mini-program and browser adapters resolve this against their current origin.
  if (!req) return path

  const headers = req.headers || {}
  const forwardedProto = headers['x-forwarded-proto']
  const forwardedHost = headers['x-forwarded-host']
  const protocol = (forwardedProto ? forwardedProto.split(',')[0] : (req.protocol || 'http')).trim()
  const host = (forwardedHost ? forwardedHost.split(',')[0] : headers.host || '').trim()

  // SSR has no browser origin.  Derive it from this request instead of sharing
  // a process-wide value (or assuming a localhost deployment).
  if (!host) {
    throw new Error('Unable to resolve the request origin for product SSR')
  }

  return `${protocol}://${host}${path}`
}

function getRequestHeaders (ssrContext) {
  const headers = (ssrContext && ssrContext.req && ssrContext.req.headers) || {}
  const result = {}

  // Keep request-scoped credentials when the server renders the API call.
  if (headers.cookie) result.cookie = headers.cookie
  if (headers.authorization) result.authorization = headers.authorization
  return result
}

function request (path, ssrContext) {
  return new Promise((resolve, reject) => {
    mpx.request({
      url: getRequestUrl(path, ssrContext),
      header: getRequestHeaders(ssrContext),
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
