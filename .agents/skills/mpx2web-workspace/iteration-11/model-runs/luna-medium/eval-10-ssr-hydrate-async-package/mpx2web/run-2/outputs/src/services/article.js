export function fetchArticle (articleId, requestContext) {
  const context = requestContext || {}
  const request = context.fetch || globalThis.fetch
  const origin = context.origin || ''
  const url = `${origin}/api/articles/${encodeURIComponent(articleId)}`
  return request(url, context.fetchOptions).then((response) => response.json())
}
