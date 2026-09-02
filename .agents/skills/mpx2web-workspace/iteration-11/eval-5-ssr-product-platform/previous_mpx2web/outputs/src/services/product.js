import mpx from '@mpxjs/core'

function firstHeaderValue (value) {
  if (Array.isArray(value)) return value[0] || ''
  return String(value || '').split(',')[0].trim()
}

function getRequestOrigin (req) {
  const headers = req.headers || {}
  const forwardedProtocol = firstHeaderValue(headers['x-forwarded-proto'])
  const protocol = forwardedProtocol || req.protocol ||
    (req.socket && req.socket.encrypted ? 'https' : 'http')
  const forwardedHost = firstHeaderValue(headers['x-forwarded-host'])
  const requestHost = typeof req.get === 'function' ? req.get('host') : headers.host
  const host = forwardedHost || requestHost

  if (!host) {
    throw new Error('Cannot resolve the current SSR request host')
  }

  return `${protocol}://${host}`
}

function getForwardHeaders (req) {
  const sourceHeaders = req.headers || {}
  const headers = {}

  if (sourceHeaders.cookie) headers.cookie = sourceHeaders.cookie
  if (sourceHeaders.authorization) headers.authorization = sourceHeaders.authorization

  return headers
}

async function requestFromNode (path, req) {
  const response = await fetch(`${getRequestOrigin(req)}${path}`, {
    headers: getForwardHeaders(req)
  })

  if (!response.ok) {
    throw new Error(`Product request failed with status ${response.status}`)
  }

  return response.json()
}

function requestFromClient (path) {
  return new Promise((resolve, reject) => {
    mpx.request({
      url: path,
      success: ({ data }) => resolve(data),
      fail: reject
    })
  })
}

function requestProductData (path, requestContext) {
  const req = requestContext && requestContext.req
  return req ? requestFromNode(path, req) : requestFromClient(path)
}

export function fetchProduct (productId, requestContext) {
  const encodedProductId = encodeURIComponent(productId)
  return requestProductData(`/api/products/${encodedProductId}`, requestContext)
}

export function fetchRecommendations (productId, requestContext) {
  const encodedProductId = encodeURIComponent(productId)
  return requestProductData(
    `/api/products/${encodedProductId}/recommendations`,
    requestContext
  )
}
