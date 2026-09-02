import mpx from '@mpxjs/api-proxy'

function firstHeaderValue (value) {
  if (Array.isArray(value)) value = value[0]
  return typeof value === 'string' ? value.split(',')[0].trim() : ''
}

function getServerOrigin (req) {
  if (!req) return ''

  const headers = req.headers || {}
  const forwardedProtocol = firstHeaderValue(headers['x-forwarded-proto'])
  const protocol = forwardedProtocol === 'https' || forwardedProtocol === 'http'
    ? forwardedProtocol
    : (req.protocol || (req.socket && req.socket.encrypted ? 'https' : 'http'))
  const host = firstHeaderValue(headers['x-forwarded-host']) || firstHeaderValue(headers.host)

  if (!host) {
    throw new Error('Cannot resolve the API origin from the current SSR request')
  }
  return `${protocol}://${host}`
}

function request (path, req) {
  const options = {
    // Browsers and mini programs keep the root-relative URL. Only Node needs an origin.
    url: `${getServerOrigin(req)}${path}`
  }

  // Keep request-bound credentials request-bound during SSR as well.
  if (req && req.headers) {
    const header = {}
    if (req.headers.cookie) header.cookie = req.headers.cookie
    if (req.headers.authorization) header.authorization = req.headers.authorization
    if (Object.keys(header).length) options.header = header
  }

  return new Promise((resolve, reject) => {
    mpx.request({
      ...options,
      success: ({ data }) => resolve(data),
      fail: reject
    })
  })
}

export function fetchProduct (productId, req) {
  return request(`/api/products/${encodeURIComponent(productId)}`, req)
}

export function fetchRecommendations (productId, req) {
  return request(`/api/products/${encodeURIComponent(productId)}/recommendations`, req)
}
