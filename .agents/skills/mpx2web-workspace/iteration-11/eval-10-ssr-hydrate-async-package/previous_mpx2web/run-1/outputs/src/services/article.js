function resolveRequest (requestContext) {
  if (typeof requestContext === 'function') return requestContext
  if (requestContext && typeof requestContext.request === 'function') {
    return requestContext.request.bind(requestContext)
  }
  if (requestContext && typeof requestContext.fetch === 'function') {
    return requestContext.fetch.bind(requestContext)
  }
  return fetch
}

function readResponseData (response) {
  if (response && typeof response.json === 'function') return response.json()
  if (response && Object.prototype.hasOwnProperty.call(response, 'data')) return response.data
  return response
}

export function fetchArticle (articleId, requestContext) {
  const request = resolveRequest(requestContext)
  return Promise.resolve(request(`/api/articles/${encodeURIComponent(articleId)}`)).then(readResponseData)
}
