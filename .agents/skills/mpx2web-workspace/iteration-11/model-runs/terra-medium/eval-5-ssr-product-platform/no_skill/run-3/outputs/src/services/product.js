import mpx from '@mpxjs/api-proxy'

function getHeader (req, name) {
  if (!req || !req.headers) return ''
  const value = req.headers[name] || req.headers[name.toLowerCase()]
  return Array.isArray(value) ? value[0] : (value || '')
}

// Mini Program and browser requests intentionally stay relative.  During SSR,
// mpx.request needs an absolute URL, which is derived from this render's req.
function getRequestUrl (path, ssrContext) {
  const req = ssrContext && ssrContext.req
  if (!req) return path

  const forwardedProtocol = getHeader(req, 'x-forwarded-proto').split(',')[0].trim()
  const protocol = forwardedProtocol || req.protocol || (req.socket && req.socket.encrypted ? 'https' : 'http')
  const host = getHeader(req, 'x-forwarded-host').split(',')[0].trim() || getHeader(req, 'host')

  if (!host) {
    throw new Error('SSR product request is missing its Host header')
  }
  return `${protocol}://${host}${path}`
}

function request (path, ssrContext) {
  const req = ssrContext && ssrContext.req
  const header = {}
  const cookie = getHeader(req, 'cookie')
  if (cookie) header.cookie = cookie

  return new Promise((resolve, reject) => {
    mpx.request({
      url: getRequestUrl(path, ssrContext),
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
