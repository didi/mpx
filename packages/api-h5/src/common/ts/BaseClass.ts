class Base {
  _resolve: (value?: unknown) => void = null
  _reject: (reason?: any) => void = null

  initPromise () {
    return new Promise((resolve, reject) => {
      this._resolve = resolve
      this._reject = reject
    })
  }

  resolvePromise (res, success) {
    !success && this._resolve(res)
  }

  rejectPromise (err, fail) {
    !fail && this._reject(err)
  }
}

export default Base
