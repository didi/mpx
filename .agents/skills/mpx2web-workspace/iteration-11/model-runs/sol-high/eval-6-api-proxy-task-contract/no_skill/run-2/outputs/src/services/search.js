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
  const options = {
    url: '/api/search/suggest',
    data: { keyword }
  }

  if (controller) options.signal = controller.signal

  const requestPromise = request(options)
  const suggestionsPromise = requestPromise.then(({ data }) => data.list)

  suggestionsPromise.abort = () => {
    if (controller) controller.abort()
    if (requestPromise && typeof requestPromise.abort === 'function') {
      requestPromise.abort()
    }
  }

  return suggestionsPromise
}
