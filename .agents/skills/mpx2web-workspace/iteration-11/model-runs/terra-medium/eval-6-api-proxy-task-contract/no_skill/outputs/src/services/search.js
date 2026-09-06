import { request } from '@mpxjs/api-proxy'

export function fetchTrendingKeywords () {
  return request({
    url: '/api/search/trending'
  }).then(({ data }) => data)
}

export function requestSuggestions (keyword) {
  const promise = request({
    url: '/api/search/suggest',
    data: { keyword }
  })

  return {
    promise,
    abort () {
      if (typeof promise.abort === 'function') {
        promise.abort()
      }
    }
  }
}
