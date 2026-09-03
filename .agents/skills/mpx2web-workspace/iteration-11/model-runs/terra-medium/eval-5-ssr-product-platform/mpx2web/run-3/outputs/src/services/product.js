import mpx from '@mpxjs/api-proxy'

function getServerUrl (path, ssrContext) {
  const req = ssrContext && ssrContext.req
  if (!req) return path

  const headers = req.headers || {}
  const host = headers['x-forwarded-host'] || headers.host
  if (!host) return path

  const forwardedProto = headers['x-forwarded-proto']
  const protocol = (Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto || req.protocol || 'http')
    .split(',')[0]
    .trim()
  return `${protocol}://${host}${path}`
}

function getRequestHeaders (ssrContext) {
  const req = ssrContext && ssrContext.req
  if (!req || !req.headers) return undefined

  const headers = {}
  if (req.headers.cookie) headers.cookie = req.headers.cookie
  if (req.headers.authorization) headers.authorization = req.headers.authorization
  return headers
}

function request (path, ssrContext) {
  return new Promise((resolve, reject) => {
    mpx.request({
      url: getServerUrl(path, ssrContext),
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
