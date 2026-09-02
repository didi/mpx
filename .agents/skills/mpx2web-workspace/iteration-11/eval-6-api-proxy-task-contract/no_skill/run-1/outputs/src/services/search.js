import { request } from '@mpxjs/api-proxy'

export function fetchTrendingKeywords () {
  return request({
    url: '/api/search/trending'
  }).then(({ data }) => data)
}

export function requestSuggestions (keyword) {
  let requestTask = null
  let aborted = false

  const promise = request({
    url: '/api/search/suggest',
    data: { keyword },
    getTask (task) {
      requestTask = task
      if (aborted && requestTask && typeof requestTask.abort === 'function') {
        requestTask.abort()
      }
    }
  }).then(({ data }) => data.list)

  return {
    promise,
    abort () {
      aborted = true
      if (requestTask && typeof requestTask.abort === 'function') {
        requestTask.abort()
      }
    }
  }
}
