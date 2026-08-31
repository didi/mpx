import mpx from '@mpxjs/api-proxy'

function getRequestProtocol (request) {
  if (request.protocol) return request.protocol
  const forwardedProtocol = request.headers['x-forwarded-proto']
  if (forwardedProtocol) {
    const protocol = Array.isArray(forwardedProtocol) ? forwardedProtocol[0] : forwardedProtocol
    return protocol.split(',')[0].trim()
  }
  return request.socket.encrypted ? 'https' : 'http'
}

function getRequestOptions (url, requestContext) {
  const options = { url }
  if (!requestContext || !requestContext.req) return options

  const request = requestContext.req
  options.url = `${getRequestProtocol(request)}://${request.headers.host}${url}`
  const header = {}
  ;['cookie', 'authorization'].forEach((name) => {
    if (request.headers[name]) header[name] = request.headers[name]
  })
  options.header = header
  return options
}

function request (url, requestContext) {
  return new Promise((resolve, reject) => {
    mpx.request(Object.assign(getRequestOptions(url, requestContext), {
      success: ({ data }) => resolve(data),
      fail: reject
    }))
  })
}

export function fetchProduct (productId, requestContext) {
  return request(`/api/products/${productId}`, requestContext)
}

export function fetchRecommendations (productId, requestContext) {
  return request(`/api/products/${productId}/recommendations`, requestContext)
}
