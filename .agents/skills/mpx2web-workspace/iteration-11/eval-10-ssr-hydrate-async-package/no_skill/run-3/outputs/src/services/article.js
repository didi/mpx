import mpx from '@mpxjs/core'

function getOrigin (requestContext) {
  if (typeof window !== 'undefined') return window.location.origin

  const request = requestContext && requestContext.req
  const headers = request && request.headers
  const host = headers && (headers['x-forwarded-host'] || headers.host)
  if (!host) return 'http://localhost:3000'

  const forwardedProtocol = headers['x-forwarded-proto']
  const protocol = forwardedProtocol
    ? forwardedProtocol.split(',')[0].trim()
    : request.protocol || (request.socket && request.socket.encrypted ? 'https' : 'http')
  return `${protocol}://${host}`
}

function fetchWithMpx (url) {
  return new Promise((resolve, reject) => {
    mpx.request({
      url,
      success (response) { resolve(response.data) },
      fail: reject
    })
  })
}

export function fetchArticle (articleId, requestContext) {
  const url = `${getOrigin(requestContext)}/api/articles/${encodeURIComponent(articleId)}`
  if (typeof window === 'undefined' && !requestContext) return fetchWithMpx(url)

  const cookie = requestContext && requestContext.req && requestContext.req.headers.cookie
  const options = cookie ? { headers: { cookie } } : undefined
  return fetch(url, options).then((response) => response.json())
}
