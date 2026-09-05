import mpx from '@mpxjs/core'

function getRequestOrigin (requestContext) {
  if (!requestContext) return ''
  if (requestContext.origin) return requestContext.origin

  const request = requestContext.req || requestContext.request
  if (!request || typeof request === 'function') return ''
  if (request.origin) return request.origin

  const headers = request.headers || {}
  const forwardedProtocol = headers['x-forwarded-proto']
  const forwardedHost = headers['x-forwarded-host']
  const protocol = String(forwardedProtocol || request.protocol || 'http').split(',')[0].trim()
  const host = String(forwardedHost || headers.host || '').split(',')[0].trim()
  return host ? `${protocol}://${host}` : ''
}

export function fetchArticle (articleId, requestContext) {
  const path = `/api/articles/${encodeURIComponent(articleId)}`

  if (__mpx_mode__ !== 'web') {
    return new Promise((resolve, reject) => {
      mpx.request({
        url: path,
        success: (response) => resolve(response.data),
        fail: reject
      })
    })
  }

  const request = requestContext && requestContext.fetch
  const fetcher = typeof request === 'function' ? request : fetch
  return fetcher(`${getRequestOrigin(requestContext)}${path}`).then((response) => response.json())
}
