import mpx from '@mpxjs/core'

function getRequestOrigin (requestContext) {
  const request = requestContext && requestContext.req
  if (!request) return ''

  const headers = request.headers || {}
  const forwardedProtocol = String(headers['x-forwarded-proto'] || '').split(',')[0].trim()
  const forwardedHost = String(headers['x-forwarded-host'] || '').split(',')[0].trim()
  const protocol = forwardedProtocol || (request.socket && request.socket.encrypted ? 'https' : 'http')
  const host = forwardedHost || headers.host

  if (!host) throw new Error('SSR request host is missing')
  return `${protocol}://${host}`
}

function fetchArticleInMiniProgram (url) {
  return new Promise((resolve, reject) => {
    mpx.request({
      url,
      usePromise: false,
      success (response) {
        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve(response.data)
          return
        }
        reject(new Error(`Article request failed with status ${response.statusCode}`))
      },
      fail: reject
    })
  })
}

export function fetchArticle (articleId, requestContext) {
  const path = `/api/articles/${encodeURIComponent(articleId)}`

  if (__mpx_mode__ !== 'web') return fetchArticleInMiniProgram(path)

  const origin = getRequestOrigin(requestContext)
  return fetch(origin ? `${origin}${path}` : path).then((response) => {
    if (!response.ok) throw new Error(`Article request failed with status ${response.status}`)
    return response.json()
  })
}
