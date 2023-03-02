const loaderToIdent = (data: { options: string; loader: string; ident: string }) => {
  if (!data.options) {
    return data.loader
  }
  if (typeof data.options === 'string') {
    return data.loader + '?' + data.options
  }
  if (typeof data.options !== 'object') {
    throw new Error('loader options must be string or object')
  }
  if (data.ident) {
    return data.loader + '??' + data.ident
  }
  return data.loader + '?' + JSON.stringify(data.options)
}

export const stringifyLoadersAndResource = (loaders: any, resource: string) => {
  let str = ''
  for (const loader of loaders) {
    str += loaderToIdent(loader) + '!'
  }
  return str + resource
}
