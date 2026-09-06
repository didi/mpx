import { request } from '@mpxjs/api-proxy'

export function fetchTrendingKeywords () {
  return request({
    url: '/api/search/trending'
  }).then(({ data }) => data)
}

export function requestSuggestions (keyword) {
  const controller = typeof AbortController === 'function'
    ? new AbortController()
    : null
  const requestOptions = {
    url: '/api/search/suggest',
    data: { keyword }
  }

  if (controller) requestOptions.signal = controller.signal

  const requestPromise = request(requestOptions)
  const promise = requestPromise.then(({ data }) => data.list)

  promise.abort = () => {
    if (controller) controller.abort()
    if (requestPromise && typeof requestPromise.abort === 'function') {
      requestPromise.abort()
    }
  }

  return promise
}
