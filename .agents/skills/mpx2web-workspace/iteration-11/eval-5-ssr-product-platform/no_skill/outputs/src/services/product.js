import mpx from '@mpxjs/api-proxy'

function getHeaderValue (value) {
  if (Array.isArray(value)) return value[0]
  return value && value.split(',')[0].trim()
}

function getRequestUrl (path, req) {
  if (!req) return path

  const headers = req.headers || {}
  const protocol = getHeaderValue(headers['x-forwarded-proto']) || req.protocol || (req.socket && req.socket.encrypted ? 'https' : 'http')
  const host = getHeaderValue(headers['x-forwarded-host']) || getHeaderValue(headers.host)
  if (!host) throw new Error('Cannot resolve API origin from the SSR request')
  return `${protocol}://${host}${path}`
}

function request (path, req) {
  return new Promise((resolve, reject) => {
    mpx.request({
      url: getRequestUrl(path, req),
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
