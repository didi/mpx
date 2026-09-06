function getServerOrigin (requestContext) {
  const request = requestContext && (requestContext.req || requestContext.request)
  const headers = (request && request.headers) || {}
  const protocol = headers['x-forwarded-proto'] || requestContext.protocol || 'http'
  const host = headers['x-forwarded-host'] || headers.host || requestContext.host || 'localhost:3000'
  return requestContext.origin || `${String(protocol).split(',')[0]}://${String(host).split(',')[0]}`
}

export function fetchArticle (articleId, requestContext) {
  const isBrowser = typeof window !== 'undefined'
  const origin = isBrowser ? window.location.origin : getServerOrigin(requestContext || {})
  const request = requestContext && (requestContext.req || requestContext.request)
  const cookie = request && request.headers && request.headers.cookie
  const headers = cookie ? { cookie } : undefined
  const id = encodeURIComponent(String(articleId || ''))

  return fetch(`${origin}/api/articles/${id}`, { headers })
    .then((response) => {
      if (!response.ok) throw new Error(`Unable to load article ${id}: ${response.status}`)
      return response.json()
    })
}
