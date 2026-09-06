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
  const suggestionPromise = requestTask.then(({ data }) => data)

  suggestionPromise.abort = () => {
    if (typeof requestTask.abort === 'function') {
      requestTask.abort()
    }
  }

  return suggestionPromise
}
