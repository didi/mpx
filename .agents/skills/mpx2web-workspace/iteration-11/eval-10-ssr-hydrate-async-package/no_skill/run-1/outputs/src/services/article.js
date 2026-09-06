function getServerOrigin (requestContext) {
  if (requestContext && requestContext.origin) return requestContext.origin

  const request = requestContext && (requestContext.req || requestContext.request)
  const headers = request && request.headers
  const host = headers && (headers['x-forwarded-host'] || headers.host)
  const protocol = headers && headers['x-forwarded-proto']

  if (host) return `${protocol || 'http'}://${host}`
  return 'http://localhost:3000'
}

export function fetchArticle (articleId, requestContext, options = {}) {
  const isServer = typeof window === 'undefined'
  const origin = isServer ? getServerOrigin(requestContext) : window.location.origin
  const request = requestContext && (requestContext.req || requestContext.request)
  const cookie = isServer && request && request.headers && request.headers.cookie
  const headers = cookie ? { cookie } : undefined
  const id = encodeURIComponent(String(articleId || ''))

  return fetch(`${origin}/api/articles/${id}`, {
    signal: options.signal,
    headers
  }).then((response) => {
    if (!response.ok) throw new Error(`Unable to load article: ${response.status}`)
    return response.json()
  })
}
