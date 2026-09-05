export function fetchArticle (articleId, requestContext) {
  const path = `/api/articles/${encodeURIComponent(articleId)}`
  const baseUrl = requestContext && (
    requestContext.origin || requestContext.baseUrl || requestContext.baseURL
  )
  const url = baseUrl ? `${baseUrl.replace(/\/$/, '')}${path}` : path
  const request = requestContext && (requestContext.fetch || requestContext.request)
  const fetcher = typeof request === 'function'
    ? request
    : (typeof globalThis !== 'undefined' ? globalThis.fetch : null)
  if (!fetcher) return Promise.reject(new Error('No isomorphic request client available'))
  return Promise.resolve(fetcher(url)).then((response) => response.json())
}
