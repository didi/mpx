import mpx from '@mpxjs/api-proxy'

function firstHeaderValue (value) {
  const headerValue = Array.isArray(value) ? value[0] : value
  return typeof headerValue === 'string' ? headerValue.split(',')[0].trim() : ''
}

function getServerOrigin (req) {
  const headers = req.headers || {}
  const protocol = req.protocol ||
    firstHeaderValue(headers['x-forwarded-proto']) ||
    (req.socket && req.socket.encrypted ? 'https' : 'http')
  const host = firstHeaderValue(headers['x-forwarded-host']) || firstHeaderValue(headers.host)

  if (!host) {
    throw new Error('Unable to resolve the SSR request origin')
  }

  return `${String(protocol).replace(/:$/, '')}://${host}`
}

function getServerHeaders (req) {
  const sourceHeaders = req.headers || {}
  const headers = {}

  ;['authorization', 'cookie', 'accept-language', 'user-agent'].forEach((name) => {
    const value = sourceHeaders[name]
    if (typeof value === 'string') headers[name] = value
  })

  return headers
}

function requestJson (path, requestContext) {
  const req = requestContext && requestContext.req

  if (req) {
    if (typeof fetch !== 'function') {
      return Promise.reject(new Error('The Node SSR runtime must provide fetch'))
    }

    return fetch(`${getServerOrigin(req)}${path}`, {
      headers: getServerHeaders(req)
    }).then((response) => {
      if (!response.ok) {
        throw new Error(`Product API request failed with status ${response.status}`)
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
  return requestJson(`/api/products/${encodeURIComponent(productId)}`, requestContext)
}

export function fetchRecommendations (productId, requestContext) {
  return requestJson(`/api/products/${encodeURIComponent(productId)}/recommendations`, requestContext)
}
