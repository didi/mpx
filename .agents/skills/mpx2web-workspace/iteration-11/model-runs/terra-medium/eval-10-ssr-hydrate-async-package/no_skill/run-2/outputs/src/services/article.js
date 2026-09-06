function getServerRequest (requestContext = {}) {
  const request = requestContext.req || requestContext.request || {}
  const headers = requestContext.headers || request.headers || {}
  const forwardedProtocol = headers['x-forwarded-proto']
  const protocol = requestContext.protocol || (forwardedProtocol && forwardedProtocol.split(',')[0]) || 'http'
  const forwardedHost = headers['x-forwarded-host']
  const host = (forwardedHost && forwardedHost.split(',')[0]) || headers.host || 'localhost:3000'
  const origin = requestContext.origin || `${protocol}://${host}`
  const cookie = headers.cookie

  return {
    origin,
    headers: cookie ? { cookie } : undefined
  }
}

export function fetchArticle (articleId, requestContext) {
  const id = encodeURIComponent(String(articleId))
  const isBrowser = typeof window !== 'undefined'
  const serverRequest = isBrowser ? null : getServerRequest(requestContext)
  const url = isBrowser ? `/api/articles/${id}` : `${serverRequest.origin}/api/articles/${id}`

  return fetch(url, serverRequest && serverRequest.headers ? { headers: serverRequest.headers } : undefined)
    .then((response) => {
      if (!response.ok) throw new Error(`Failed to load article ${id}: ${response.status}`)
      return response.json()
    })
}
