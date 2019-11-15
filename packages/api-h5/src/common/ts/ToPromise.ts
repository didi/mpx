class ToPromise {
  _resolve: (value?: unknown) => void = null
  _reject: (reason?: any) => void = null
  toPromiseInitPromise () {
    return new Promise((resolve, reject) => {
      this._resolve = resolve
      this._reject = reject
    })
  }
  toPromiseResolve (res) {
    this._resolve(res)
  }
  toPromiseReject (err) {
    this._reject(err)
  }
}

export default ToPromise
