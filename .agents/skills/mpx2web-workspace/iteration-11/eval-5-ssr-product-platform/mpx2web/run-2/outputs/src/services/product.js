import mpx from '@mpxjs/api-proxy'

function createServerUrl (path, req) {
  const forwardedProtocol = req.headers['x-forwarded-proto']
  const forwardedHost = req.headers['x-forwarded-host']
  const protocol = req.protocol || (forwardedProtocol && forwardedProtocol.split(',')[0].trim()) || 'http'
  const host = (forwardedHost && forwardedHost.split(',')[0].trim()) || req.headers.host
  return `${protocol}://${host}${path}`
}

function createServerHeaders (req) {
  const headers = {}
  if (req.headers.cookie) headers.cookie = req.headers.cookie
  if (req.headers.authorization) headers.authorization = req.headers.authorization
  return headers
}

function request (path, requestContext) {
  if (requestContext && requestContext.req) {
    const req = requestContext.req
    return fetch(createServerUrl(path, req), {
      headers: createServerHeaders(req)
    }).then((response) => {
      if (!response.ok) throw new Error(`Request failed with status ${response.status}`)
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
  return request(`/api/products/${encodeURIComponent(productId)}`, requestContext)
}

export function fetchRecommendations (productId, requestContext) {
  return request(`/api/products/${encodeURIComponent(productId)}/recommendations`, requestContext)
}
