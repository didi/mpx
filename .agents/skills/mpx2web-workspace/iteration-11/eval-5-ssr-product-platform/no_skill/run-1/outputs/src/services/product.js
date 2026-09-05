import mpx from '@mpxjs/api-proxy'

function firstHeaderValue (value) {
  if (Array.isArray(value)) return value[0]
  return typeof value === 'string' ? value.split(',')[0].trim() : ''
}

function getRequestOrigin (ssrContext) {
  const req = ssrContext && ssrContext.req
  if (!req) return ''

  const headers = req.headers || {}
  const host = firstHeaderValue(headers['x-forwarded-host']) || firstHeaderValue(headers.host)
  if (!host) {
    throw new Error('Unable to resolve the SSR request host')
  }

  const forwardedProtocol = firstHeaderValue(headers['x-forwarded-proto'])
  const protocol = forwardedProtocol || (req.socket && req.socket.encrypted ? 'https' : 'http')
  return `${protocol}://${host}`
}

function getForwardHeaders (ssrContext) {
  const req = ssrContext && ssrContext.req
  const requestHeaders = (req && req.headers) || {}
  const headers = {}

  if (requestHeaders.cookie) headers.cookie = requestHeaders.cookie
  if (requestHeaders.authorization) headers.authorization = requestHeaders.authorization
  if (requestHeaders['accept-language']) headers['accept-language'] = requestHeaders['accept-language']

  return headers
}

function request (path, ssrContext) {
  const origin = getRequestOrigin(ssrContext)

  return new Promise((resolve, reject) => {
    mpx.request({
      // Node needs an absolute URL. Browser and mini-program requests stay relative.
      url: origin ? `${origin}${path}` : path,
      header: getForwardHeaders(ssrContext),
      success: ({ data, statusCode }) => {
        if (statusCode >= 200 && statusCode < 300) {
          resolve(data)
          return
        }
        reject(new Error(`Product request failed with status ${statusCode}`))
      },
      fail: reject
    })
  })
}

export function fetchProduct (productId, ssrContext) {
  return request(`/api/products/${encodeURIComponent(productId)}`, ssrContext)
}

export function fetchRecommendations (productId, ssrContext) {
  return request(`/api/products/${encodeURIComponent(productId)}/recommendations`, ssrContext)
}
