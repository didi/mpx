function requestOrigin (requestContext) {
  const req = requestContext && requestContext.req
  if (!req) return ''

  const headers = req.headers || {}
  const forwardedProtocol = String(headers['x-forwarded-proto'] || '').split(',')[0].trim()
  const forwardedHost = String(headers['x-forwarded-host'] || '').split(',')[0].trim()
  const protocol = forwardedProtocol || (req.socket && req.socket.encrypted ? 'https' : 'http')
  const host = forwardedHost || headers.host

  if (!host) throw new Error('SSR request host is missing')
  return `${protocol}://${host}`
}

function requestArticleInMiniProgram (path) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: path,
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

  if (__mpx_mode__ !== 'web') return requestArticleInMiniProgram(path)

  const origin = requestOrigin(requestContext)
  return fetch(origin ? `${origin}${path}` : path).then((response) => {
    if (!response.ok) throw new Error(`Article request failed with status ${response.status}`)
    return response.json()
  })
}
