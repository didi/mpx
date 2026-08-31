import mpx from '@mpxjs/api-proxy'

function getFirstHeaderValue (value) {
  if (Array.isArray(value)) value = value[0]
  return value && String(value).split(',')[0].trim()
}

function getRequestOrigin (req) {
  const headers = req.headers || {}
  const protocol = getFirstHeaderValue(headers['x-forwarded-proto']) || req.protocol || (req.socket && req.socket.encrypted ? 'https' : 'http')
  const host = getFirstHeaderValue(headers['x-forwarded-host']) || getFirstHeaderValue(headers.host)

  if (!host) throw new Error('Unable to resolve the SSR request host')
  return `${protocol}://${host}`
}

function getRequestUrl (path, req) {
  return req ? `${getRequestOrigin(req)}${path}` : path
}

function request (url, req) {
  return new Promise((resolve, reject) => {
    mpx.request({
      url: getRequestUrl(url, req),
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
