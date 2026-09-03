function parseForwardedHeader (value) {
  return value && String(value).split(',')[0].trim()
}

function getServerRequest (requestContext) {
  if (!requestContext) return null
  return requestContext.req || requestContext.request || null
}

function getServerOrigin (requestContext) {
  const request = getServerRequest(requestContext)
  const headers = (request && request.headers) || {}
  const protocol = parseForwardedHeader(headers['x-forwarded-proto']) ||
    (request && request.protocol) ||
    'http'
  const host = parseForwardedHeader(headers['x-forwarded-host']) ||
    headers.host ||
    'localhost:3000'
  return `${protocol}://${host}`
}

function requestInWechat (url) {
  return new Promise((resolve, reject) => {
    wx.request({
      url,
      success (response) {
        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve(response.data)
        } else {
          reject(new Error(`Article request failed with status ${response.statusCode}`))
        }
      },
      fail: reject
    })
  })
}

export function fetchArticle (articleId, requestContext) {
  const path = `/api/articles/${encodeURIComponent(articleId)}`

  if (typeof window !== 'undefined') {
    return fetch(`${window.location.origin}${path}`).then((response) => {
      if (!response.ok) throw new Error(`Article request failed with status ${response.status}`)
      return response.json()
    })
  }

  if (typeof wx !== 'undefined' && typeof wx.request === 'function') {
    return requestInWechat(path)
  }

  const request = getServerRequest(requestContext)
  const cookie = request && request.headers && request.headers.cookie
  const options = cookie ? { headers: { cookie } } : undefined
  return fetch(`${getServerOrigin(requestContext)}${path}`, options).then((response) => {
    if (!response.ok) throw new Error(`Article request failed with status ${response.status}`)
    return response.json()
  })
}
