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
  const promise = requestTask.then(({ data }) => data)

  promise.abort = () => {
    if (requestTask && typeof requestTask.abort === 'function') {
      requestTask.abort()
    }
  }

  return promise
}
