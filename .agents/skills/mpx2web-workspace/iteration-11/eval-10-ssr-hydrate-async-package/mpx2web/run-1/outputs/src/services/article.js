import mpx from '@mpxjs/api-proxy'

function firstHeaderValue (value) {
  return value && value.split(',')[0].trim()
}

function createRequestOptions (path, requestContext) {
  const options = { url: path }
  const req = requestContext && requestContext.req
  if (!req) return options

  const headers = req.headers || {}
  const protocol = firstHeaderValue(headers['x-forwarded-proto']) || req.protocol || (req.socket && req.socket.encrypted ? 'https' : 'http')
  const host = firstHeaderValue(headers['x-forwarded-host']) || headers.host
  options.url = `${protocol}://${host}${path}`
  return options
}

export function fetchArticle (articleId, requestContext) {
  return new Promise((resolve, reject) => {
    const options = createRequestOptions(`/api/articles/${articleId}`, requestContext)
    options.success = ({ data }) => resolve(data)
    options.fail = reject
    mpx.request(options)
  })
}
