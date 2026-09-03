import mpx from '@mpxjs/api-proxy'

function getServerOrigin (request) {
  const headers = request && request.headers || {}
  const host = headers.host || headers.Host
  if (!host) return ''
  const forwardedProto = headers['x-forwarded-proto'] || headers['X-Forwarded-Proto']
  const protocol = forwardedProto || (request.socket && request.socket.encrypted ? 'https' : 'http')
  return `${protocol}://${host}`
}

function requestJson (path, ssrContext) {
  const request = ssrContext && ssrContext.req

  // Node receives the current request so its host, protocol and headers remain request-scoped.
  if (request) {
    const origin = getServerOrigin(request)
    if (!origin || typeof fetch !== 'function') {
      return Promise.reject(new Error('SSR request context cannot create an HTTP request'))
    }
    const headers = {}
    if (request.headers && request.headers.cookie) headers.cookie = request.headers.cookie
    return fetch(`${origin}${path}`, { headers }).then((response) => {
      if (!response.ok) throw new Error(`Request failed with ${response.status}`)
      return response.json()
    })
  }

  // Browser and WeChat Mini Program requests intentionally remain relative.
  return new Promise((resolve, reject) => {
    mpx.request({
      url: path,
      success: ({ data }) => resolve(data),
      fail: reject
    })
  })
}

export function fetchProduct (productId, ssrContext) {
  return requestJson(`/api/products/${encodeURIComponent(productId)}`, ssrContext)
}

export function fetchRecommendations (productId, ssrContext) {
  return requestJson(`/api/products/${encodeURIComponent(productId)}/recommendations`, ssrContext)
}
