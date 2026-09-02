import mpx from '@mpxjs/core'

function firstHeaderValue (value) {
  const headerValue = Array.isArray(value) ? value[0] : value
  return typeof headerValue === 'string' ? headerValue.split(',')[0].trim() : ''
}

function getSsrRequestOptions (path, requestContext) {
  const req = requestContext && requestContext.req
  if (!req) {
    return { url: path }
  }

  const headers = req.headers || {}
  const protocol = firstHeaderValue(headers['x-forwarded-proto']) ||
    req.protocol ||
    (req.socket && req.socket.encrypted ? 'https' : 'http')
  const host = firstHeaderValue(headers['x-forwarded-host']) || firstHeaderValue(headers.host)

  if (!host) {
    throw new Error('Cannot resolve the SSR request origin without a Host header')
  }

  const header = {}
  if (headers.cookie) header.cookie = headers.cookie
  if (headers.authorization) header.authorization = headers.authorization

  return {
    url: `${protocol}://${host}${path}`,
    header
  }
}

function requestData (path, requestContext) {
  const requestOptions = getSsrRequestOptions(path, requestContext)

  return new Promise((resolve, reject) => {
    mpx.request({
      ...requestOptions,
      success: ({ data }) => resolve(data),
      fail: reject
    })
  })
}

export function fetchProduct (productId, requestContext) {
  return requestData(`/api/products/${encodeURIComponent(productId)}`, requestContext)
}

export function fetchRecommendations (productId, requestContext) {
  return requestData(`/api/products/${encodeURIComponent(productId)}/recommendations`, requestContext)
}
