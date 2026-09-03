export function fetchArticle (articleId, requestContext) {
  const request = requestContext && requestContext.fetch
    ? requestContext.fetch.bind(requestContext)
    : fetch
  const origin = requestContext && requestContext.origin ? requestContext.origin : ''
  return request(`${origin}/api/articles/${articleId}`).then((response) => response.json())
}
