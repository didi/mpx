import mpx from '@mpxjs/api-proxy'

function firstHeaderValue (value) {
  if (Array.isArray(value)) return value[0] || ''
  return String(value || '').split(',')[0].trim()
}

function readRequestHeader (req, name) {
  if (typeof req.get === 'function') return req.get(name) || ''
  const headers = req.headers || {}
  return headers[name.toLowerCase()] || ''
}

function getRequestOrigin (req) {
  const host = firstHeaderValue(
    readRequestHeader(req, 'x-forwarded-host') || readRequestHeader(req, 'host')
  )
  let protocol = firstHeaderValue(readRequestHeader(req, 'x-forwarded-proto')) || req.protocol
  if (!protocol) protocol = req.socket && req.socket.encrypted ? 'https' : 'http'
  protocol = String(protocol).replace(/:$/, '')

  if (!host || !/^https?$/.test(protocol)) {
    throw new Error('Unable to determine the current SSR request origin')
  }

  return new URL('/', `${protocol}://${host}`).origin
}

function getForwardHeaders (req) {
  const headers = {}
  ;['cookie', 'authorization', 'accept-language', 'user-agent', 'x-request-id'].forEach((name) => {
    const value = readRequestHeader(req, name)
    if (value) headers[name] = value
  })
  return headers
}

async function requestFromNode (path, ssrContext) {
  const req = ssrContext.req
  const requestFetch = typeof ssrContext.fetch === 'function'
    ? ssrContext.fetch.bind(ssrContext)
    : globalThis.fetch

  if (typeof requestFetch !== 'function') {
    throw new Error('SSR requires a fetch implementation on the context or Node runtime')
  }

  const response = await requestFetch(new URL(path, getRequestOrigin(req)).toString(), {
    headers: getForwardHeaders(req)
  })
  if (!response.ok) {
    throw new Error(`Product API request failed with status ${response.status}`)
  }
  return response.json()
}

function requestJson (path, ssrContext) {
  if (ssrContext && ssrContext.req) {
    return requestFromNode(path, ssrContext)
  }

  return new Promise((resolve, reject) => {
    mpx.request({
      url: path,
      success: ({ data, statusCode }) => {
        if (statusCode && statusCode >= 400) {
          reject(new Error(`Product API request failed with status ${statusCode}`))
          return
        }
        resolve(data)
      },
      fail: reject
    })
  })
}

export function fetchProduct (productId, ssrContext) {
  return requestJson(`/api/products/${encodeURIComponent(productId)}`, ssrContext)
}

export function fetchRecommendations (productId, ssrContext) {
  return requestJson(`/api/products/${encodeURIComponent(productId)}/recommendations`, ssrContext)
}
