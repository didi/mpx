import mpx from '@mpxjs/api-proxy'

function getHeader (req, name) {
  const value = req.headers && req.headers[name]
  return Array.isArray(value) ? value[0] : value && value.split(',')[0].trim()
}

function getServerOrigin (req) {
  const forwardedProtocol = getHeader(req, 'x-forwarded-proto')
  const protocol = forwardedProtocol === 'http' || forwardedProtocol === 'https'
    ? forwardedProtocol
    : req.protocol || (req.socket && req.socket.encrypted ? 'https' : 'http')
  const host = getHeader(req, 'x-forwarded-host') || getHeader(req, 'host')
  if (!host) throw new Error('Unable to resolve the SSR request origin')
  return `${protocol}://${host}`
}

function requestFromServer (path, req) {
  const headers = {}
  const cookie = getHeader(req, 'cookie')
  const authorization = getHeader(req, 'authorization')
  if (cookie) headers.cookie = cookie
  if (authorization) headers.authorization = authorization

  return globalThis.fetch(`${getServerOrigin(req)}${path}`, { headers }).then((response) => {
    if (!response.ok) throw new Error(`Product request failed with status ${response.status}`)
    return response.json()
  })
}

function request (path, requestContext) {
  if (requestContext && requestContext.req) return requestFromServer(path, requestContext.req)

  return new Promise((resolve, reject) => {
    mpx.request({
      url: path,
      success: ({ data }) => resolve(data),
      fail: reject
    })
  })
}

export function fetchProduct (productId, requestContext) {
  return request(`/api/products/${encodeURIComponent(productId)}`, requestContext)
}

export function fetchRecommendations (productId, requestContext) {
  return request(`/api/products/${encodeURIComponent(productId)}/recommendations`, requestContext)
}
