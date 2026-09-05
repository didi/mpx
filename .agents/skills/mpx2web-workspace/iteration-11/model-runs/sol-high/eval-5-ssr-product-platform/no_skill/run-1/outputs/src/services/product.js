import mpx from '@mpxjs/api-proxy'

function firstHeaderValue (value) {
  if (Array.isArray(value)) return value[0]
  return String(value || '').split(',')[0].trim()
}

function getRequestOrigin (req) {
  if (!req) return ''

  const headers = req.headers || {}
  const forwardedProtocol = firstHeaderValue(headers['x-forwarded-proto'])
  const forwardedHost = firstHeaderValue(headers['x-forwarded-host'])
  const protocol = forwardedProtocol || req.protocol || (req.socket && req.socket.encrypted ? 'https' : 'http')
  const host = forwardedHost || firstHeaderValue(headers.host)

  if (!host) {
    throw new Error('Unable to resolve the API origin from the current SSR request')
  }

  return `${protocol}://${host}`
}

function request (path, req) {
  const origin = getRequestOrigin(req)
  const header = {}

  if (req && req.headers && req.headers.cookie) {
    header.cookie = req.headers.cookie
  }

  return new Promise((resolve, reject) => {
    mpx.request({
      url: origin ? `${origin}${path}` : path,
      header,
      success: ({ data }) => resolve(data),
      fail: reject
    })
  })
}

export function fetchProduct (productId, options = {}) {
  const id = encodeURIComponent(String(productId))
  return request(`/api/products/${id}`, options.req)
}

export function fetchRecommendations (productId, options = {}) {
  const id = encodeURIComponent(String(productId))
  return request(`/api/products/${id}/recommendations`, options.req)
}
