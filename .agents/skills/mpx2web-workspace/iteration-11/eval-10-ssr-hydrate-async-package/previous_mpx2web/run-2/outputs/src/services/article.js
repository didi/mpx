import mpx from '@mpxjs/core'

function parseResponse (response) {
  if (response && typeof response.json === 'function') {
    if (response.ok === false) {
      throw new Error(`Article request failed with status ${response.status}`)
    }
    return response.json()
  }
  if (response && Object.prototype.hasOwnProperty.call(response, 'data')) {
    return response.data
  }
  return response
}

function getRequestOrigin (requestContext) {
  if (!requestContext) return ''
  if (requestContext.origin) return requestContext.origin

  const request = requestContext.req || requestContext.request
  if (!request || typeof request !== 'object') return ''
  const headers = request.headers || {}
  const host = headers['x-forwarded-host'] || headers.host
  if (!host) return ''
  const protocol = headers['x-forwarded-proto'] || request.protocol || 'http'
  return `${String(protocol).split(',')[0]}://${String(host).split(',')[0]}`
}

export async function fetchArticle (articleId, requestContext) {
  const path = `/api/articles/${encodeURIComponent(articleId)}`

  if (__mpx_mode__ !== 'web') {
    return parseResponse(await mpx.request({ url: path, method: 'GET' }))
  }

  const request = requestContext && typeof requestContext.fetch === 'function'
    ? requestContext.fetch.bind(requestContext)
    : (typeof fetch === 'function' ? fetch : null)
  if (!request) {
    throw new Error('An SSR fetch implementation must be provided in requestContext')
  }
  const origin = getRequestOrigin(requestContext)
  const url = origin ? `${origin.replace(/\/$/, '')}${path}` : path
  return parseResponse(await request(url))
}
