function getRequestOrigin (requestContext) {
  if (typeof window !== 'undefined') return window.location.origin

  const request = requestContext && (requestContext.req || requestContext.request)
  const headers = request && request.headers
  const host = headers && (headers['x-forwarded-host'] || headers.host)
  if (host) {
    const forwardedProto = headers['x-forwarded-proto']
    const protocol = forwardedProto ? forwardedProto.split(',')[0].trim() : 'http'
    return `${protocol}://${host}`
  }
  return 'http://localhost:3000'
}

export function fetchArticle (articleId, requestContext) {
  const url = `${getRequestOrigin(requestContext)}/api/articles/${encodeURIComponent(articleId)}`
  const fetcher = requestContext && typeof requestContext.fetch === 'function'
    ? requestContext.fetch.bind(requestContext)
    : (typeof fetch === 'function' ? fetch : globalThis.fetch)

  if (typeof fetcher !== 'function') return Promise.reject(new Error('fetch is not available'))
  return fetcher(url).then((response) => {
    if (!response.ok) throw new Error(`Failed to fetch article: ${response.status}`)
    return response.json()
  })
}
