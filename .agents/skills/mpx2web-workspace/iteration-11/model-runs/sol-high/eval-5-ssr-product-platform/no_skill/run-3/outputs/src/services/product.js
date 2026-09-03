import mpx from '@mpxjs/api-proxy'

function firstHeaderValue (value) {
  if (Array.isArray(value)) return value[0]
  return typeof value === 'string' ? value.split(',')[0].trim() : ''
}

function getRequestHeader (request, name) {
  if (!request || !request.headers) return ''
  return firstHeaderValue(request.headers[name])
}

function getServerOrigin (request) {
  if (!request) return ''

  const forwardedProtocol = getRequestHeader(request, 'x-forwarded-proto')
  const protocol = forwardedProtocol || request.protocol ||
    (request.socket && request.socket.encrypted ? 'https' : 'http')
  const forwardedHost = getRequestHeader(request, 'x-forwarded-host')
  const host = forwardedHost || getRequestHeader(request, 'host') ||
    (typeof request.get === 'function' ? request.get('host') : '')

  if (!host) {
    throw new Error('Cannot resolve the API origin from the current SSR request')
  }

  return `${protocol}://${host}`
}

function getForwardHeaders (request) {
  if (!request || !request.headers) return undefined

  const header = {}
  const cookie = request.headers.cookie
  const authorization = request.headers.authorization

  if (cookie) header.cookie = cookie
  if (authorization) header.authorization = authorization

  return Object.keys(header).length ? header : undefined
}

function requestData (path, request) {
  const origin = getServerOrigin(request)
  const options = {
    url: origin ? `${origin}${path}` : path
  }
  const header = getForwardHeaders(request)
  if (header) options.header = header

  return new Promise((resolve, reject) => {
    mpx.request({
      ...options,
      success: ({ data }) => resolve(data),
      fail: reject
    })
  })
}

export function fetchProduct (productId, request) {
  const encodedProductId = encodeURIComponent(String(productId))
  return requestData(`/api/products/${encodedProductId}`, request)
}

export function fetchRecommendations (productId, request) {
  const encodedProductId = encodeURIComponent(String(productId))
  return requestData(`/api/products/${encodedProductId}/recommendations`, request)
}
