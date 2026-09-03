import { request } from '@mpxjs/api-proxy'

export function fetchTrendingKeywords () {
  return request({
    url: '/api/search/trending'
  }).then(({ data }) => data)
}

export function requestSuggestions (keyword) {
  const requestTask = request({
    url: '/api/search/suggest',
    data: { keyword }
  })

  return {
    promise: requestTask.then(({ data }) => data),
    abort () {
      if (typeof requestTask.abort === 'function') {
        requestTask.abort()
      }
    }
  }
}
