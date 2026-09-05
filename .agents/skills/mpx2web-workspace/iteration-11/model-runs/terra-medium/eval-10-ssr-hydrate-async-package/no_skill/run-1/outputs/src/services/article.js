function getServerRequest (requestContext) {
  return requestContext && (requestContext.req || requestContext.request)
}

export function fetchArticle (articleId, requestContext) {
  const request = getServerRequest(requestContext)
  const isServer = Boolean(requestContext)
  const requestHeaders = (request && request.headers) || {}
  const headers = {}

  if (requestHeaders.cookie) {
    headers.cookie = requestHeaders.cookie
  }

  const origin = isServer
    ? `${requestHeaders['x-forwarded-proto'] || 'http'}://${requestHeaders['x-forwarded-host'] || requestHeaders.host || 'localhost:3000'}`
    : typeof window !== 'undefined' ? window.location.origin : ''
  const id = encodeURIComponent(String(articleId || ''))

  return fetch(`${origin}/api/articles/${id}`, { headers }).then((response) => {
    if (!response.ok) throw new Error(`Unable to load article: ${response.status}`)
    return response.json()
  })
}
