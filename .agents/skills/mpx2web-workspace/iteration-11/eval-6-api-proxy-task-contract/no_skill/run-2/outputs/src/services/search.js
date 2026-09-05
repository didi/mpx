import { request } from '@mpxjs/api-proxy'

export function fetchTrendingKeywords () {
  return request({
    url: '/api/search/trending'
  }).then(({ data }) => data)
}

export function requestSuggestions (keyword) {
  const requestPromise = request({
    url: '/api/search/suggest',
    data: { keyword }
  })
  const requestTask = requestPromise.__returned || requestPromise

  return {
    promise: requestPromise.then(({ data }) => data.list),
    abort () {
      requestTask.abort()
    }
  }
}
