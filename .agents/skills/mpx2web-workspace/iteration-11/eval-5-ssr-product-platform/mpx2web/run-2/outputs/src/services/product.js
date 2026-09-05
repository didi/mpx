import mpx from '@mpxjs/api-proxy'

function firstForwardedValue (value) {
  if (Array.isArray(value)) return value[0]
  return String(value || '').split(',')[0].trim()
}

function getRequestOrigin (req) {
  const headers = req.headers || {}
  const protocol = firstForwardedValue(headers['x-forwarded-proto']) ||
    req.protocol ||
    (req.socket && req.socket.encrypted ? 'https' : 'http')
  const host = firstForwardedValue(headers['x-forwarded-host']) ||
    firstForwardedValue(headers.host)

  if (!host) throw new Error('Unable to determine the SSR request origin')
  return `${protocol}://${host}`
}

async function requestFromNode (path, req) {
  const headers = req.headers || {}
  const response = await fetch(new URL(path, getRequestOrigin(req)).toString(), {
    headers: {
      ...(headers.cookie ? { cookie: headers.cookie } : {}),
      ...(headers.authorization ? { authorization: headers.authorization } : {})
    }
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

function requestProductApi (path, requestContext) {
  const req = requestContext && requestContext.req
  return req ? requestFromNode(path, req) : requestFromHost(path)
}

export function fetchProduct (productId, requestContext) {
  return requestProductApi(`/api/products/${encodeURIComponent(productId)}`, requestContext)
}

export function fetchRecommendations (productId, requestContext) {
  return requestProductApi(
    `/api/products/${encodeURIComponent(productId)}/recommendations`,
    requestContext
  )
}
