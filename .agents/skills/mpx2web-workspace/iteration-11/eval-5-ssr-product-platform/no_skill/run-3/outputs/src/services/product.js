import mpx from '@mpxjs/api-proxy'

function getHeader (req, name) {
  let value = req.headers && req.headers[name]
  if (!value && typeof req.get === 'function') value = req.get(name)
  if (Array.isArray(value)) value = value[0]
  return value
}

function getForwardedHeader (req, name) {
  const value = getHeader(req, name)
  return typeof value === 'string' ? value.split(',')[0].trim() : value
}

function resolveUrl (path, req) {
  if (!req) return path

  const protocol = getForwardedHeader(req, 'x-forwarded-proto') || req.protocol ||
    (req.socket && req.socket.encrypted ? 'https' : 'http')
  const host = getForwardedHeader(req, 'x-forwarded-host') || getHeader(req, 'host')
  if (!host) throw new Error('Unable to resolve the SSR request host')
  return `${protocol}://${host}${path}`
}

function getRequestHeaders (req) {
  if (!req) return

  const header = {}
  const cookie = getHeader(req, 'cookie')
  const authorization = getHeader(req, 'authorization')
  if (cookie) header.cookie = cookie
  if (authorization) header.authorization = authorization
  return Object.keys(header).length ? header : undefined
}

function request (path, req) {
  return new Promise((resolve, reject) => {
    const options = {
      url: resolveUrl(path, req),
      success: ({ data }) => resolve(data),
      fail: reject
    }
    const header = getRequestHeaders(req)
    if (header) options.header = header
    mpx.request(options)
  })
}

export function fetchProduct (productId, req) {
  return request(`/api/products/${encodeURIComponent(productId)}`, req)
}

export function fetchRecommendations (productId, req) {
  return request(`/api/products/${encodeURIComponent(productId)}/recommendations`, req)
}
