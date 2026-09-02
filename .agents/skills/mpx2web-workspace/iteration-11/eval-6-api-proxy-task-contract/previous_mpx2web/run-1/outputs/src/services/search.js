import mpx from '@mpxjs/core'

export function fetchTrendingKeywords () {
  return mpx.request({
    url: '/api/search/trending'
  }).then(({ data }) => data)
}

export function requestSuggestions (keyword) {
  let requestTask
  let rejectRequest
  let settled = false

  const requestPromise = new Promise((resolve, reject) => {
    rejectRequest = reject
    requestTask = mpx.request({
      url: '/api/search/suggest',
      data: { keyword },
      usePromise: false,
      success (response) {
        if (settled) return
        settled = true
        resolve(response)
      },
      fail (error) {
        if (settled) return
        settled = true
        reject(error)
      }
    })
  })

  requestPromise.abort = () => {
    if (settled) return
    settled = true

    const abortError = new Error('request:fail abort')
    abortError.name = 'AbortError'
    rejectRequest(abortError)

    if (requestTask && typeof requestTask.abort === 'function') {
      requestTask.abort()
    }
  }

  return requestPromise
}
