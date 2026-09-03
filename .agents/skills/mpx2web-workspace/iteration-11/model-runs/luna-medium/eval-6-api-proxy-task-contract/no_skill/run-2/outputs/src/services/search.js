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

  let aborted = false
  const promise = requestPromise
    .then(({ data }) => {
      if (aborted) {
        const error = new Error('Request aborted')
        error.aborted = true
        throw error
      }
      return data
    })
    .catch((error) => {
      if (aborted) error.aborted = true
      throw error
    })

  return {
    promise,
    abort () {
      aborted = true
      if (requestPromise && typeof requestPromise.abort === 'function') {
        requestPromise.abort()
      }
    }
  }
}
