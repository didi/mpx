export function fetchArticle (articleId) {
  const origin = typeof window === 'undefined' ? 'http://localhost:3000' : window.location.origin
  return fetch(`${origin}/api/articles/${articleId}`).then((response) => response.json())
}
