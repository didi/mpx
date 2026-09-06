import mpx from '@mpxjs/api-proxy'

function getRequestOrigin (requestContext) {
  const req = requestContext && requestContext.req
  if (!req) return ''

  const headers = req.headers || {}
  const forwardedProtocol = String(headers['x-forwarded-proto'] || '').split(',')[0].trim()
  const forwardedHost = String(headers['x-forwarded-host'] || '').split(',')[0].trim()
  const protocol = forwardedProtocol || (req.socket && req.socket.encrypted ? 'https' : 'http')
  const host = forwardedHost || headers.host

  if (!host) throw new Error('SSR request host is missing')
  return `${protocol}://${host}`
}

function request (path, requestContext) {
  const origin = getRequestOrigin(requestContext)

  if (origin) {
    return fetch(`${origin}${path}`).then((response) => {
      if (!response.ok) {
        throw new Error(`Product request failed with status ${response.status}`)
      }
      return response.json()
    })
  }

  return new Promise((resolve, reject) => {
    mpx.request({
      url: path,
      success: ({ data }) => resolve(data),
      fail: reject
    })
  })
}

export function fetchProduct (productId, requestContext) {
  const path = `/api/products/${encodeURIComponent(productId)}`
  return request(path, requestContext)
}

export function fetchRecommendations (productId, requestContext) {
  const path = `/api/products/${encodeURIComponent(productId)}/recommendations`
  return request(path, requestContext)
}
