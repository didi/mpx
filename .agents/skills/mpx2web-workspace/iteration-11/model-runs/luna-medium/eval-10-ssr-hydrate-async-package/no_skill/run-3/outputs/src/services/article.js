function getOrigin (requestContext) {
  if (requestContext && requestContext.origin) return requestContext.origin
  if (typeof window !== 'undefined') return window.location.origin
  return 'http://localhost:3000'
}

export function fetchArticle (articleId, requestContext) {
  const fetcher = requestContext && typeof requestContext.fetch === 'function'
    ? requestContext.fetch.bind(requestContext)
    : fetch
  const options = requestContext && requestContext.signal
    ? { signal: requestContext.signal }
    : undefined
  const url = `${getOrigin(requestContext)}/api/articles/${encodeURIComponent(articleId)}`
  return fetcher(url, options).then((response) => {
    if (response.ok === false) throw new Error(`Failed to load article: ${response.status}`)
    return response.json()
  })
}
