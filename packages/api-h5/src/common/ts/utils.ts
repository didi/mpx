function warn (msg: string) {
  console.warn && console.warn(`[@mpxjs/api-h5 warn]:\n ${msg}`)
}

function error (msg: string) {
  console.error && console.error(`[@mpxjs/api-h5 error]:\n ${msg}`)
}

function handleSuccess (result: any, success?: Function, complete?: Function) {
  typeof success === 'function' && success(result)
  typeof complete === 'function' && complete(result)
}

function handleFail (result: any, fail?: Function, complete?: Function) {
  typeof fail === 'function' && fail(result)
  typeof complete === 'function' && complete(result)
}

export {
  warn,
  error,
  handleSuccess,
  handleFail
}
