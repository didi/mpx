import mpx from '@mpxjs/api-proxy'

function getNodeOrigin (req) {
  const protocol = req.protocol || (req.socket && req.socket.encrypted ? 'https' : 'http')
  const host = typeof req.get === 'function'
    ? req.get('host')
    : req.headers && req.headers.host

  if (!host) throw new Error('Cannot resolve the SSR request host')
  return `${protocol}://${host}`
}

function getForwardHeaders (req) {
  const source = req.headers || {}
  const headers = {}

  if (source.cookie) headers.cookie = source.cookie
  if (source.authorization) headers.authorization = source.authorization
  if (source['accept-language']) headers['accept-language'] = source['accept-language']

  return headers
}

async function requestFromNode (path, req) {
  const response = await fetch(`${getNodeOrigin(req)}${path}`, {
    headers: getForwardHeaders(req)
  })

  if (!response.ok) {
    throw new Error(`Product request failed with status ${response.status}`)
  }

  return response.json()
}

function requestFromHost (path) {
  return new Promise((resolve, reject) => {
    mpx.request({
      url: path,
      success: ({ data }) => resolve(data),
      fail: reject
    })
  })
}

function requestJson (path, requestContext) {
  const req = requestContext && requestContext.req
  return req ? requestFromNode(path, req) : requestFromHost(path)
}

export function fetchProduct (productId, requestContext) {
  const encodedProductId = encodeURIComponent(productId)
  return requestJson(`/api/products/${encodedProductId}`, requestContext)
}

export function fetchRecommendations (productId, requestContext) {
  const encodedProductId = encodeURIComponent(productId)
  return requestJson(`/api/products/${encodedProductId}/recommendations`, requestContext)
}
