export function fetchArticle (articleId, requestContext) {
  const request = requestContext && requestContext.fetch ? requestContext.fetch : fetch
  return request(`/api/articles/${articleId}`).then((response) => response.json())
}
