import { request } from '@mpxjs/api-proxy'

function createCancellableRequest (options) {
  const requestPromise = request(options)
  const promise = Promise.resolve(requestPromise)

  promise.cancel = () => {
    if (requestPromise && typeof requestPromise.abort === 'function') {
      requestPromise.abort()
    }
  }

  return promise
}

export function fetchTrendingKeywords () {
  return request({
    url: '/api/search/trending'
  }).then(({ data }) => data)
}

export function requestSuggestions (keyword) {
  const requestPromise = createCancellableRequest({
    url: '/api/search/suggest',
    data: { keyword }
  })
  const suggestionsPromise = requestPromise.then(({ data }) => data.list)

  suggestionsPromise.cancel = requestPromise.cancel
  return suggestionsPromise
}
