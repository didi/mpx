class ToPromise {
  constructor () {
    this._resolve = null
    this._reject = null
  }

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

export {
  ToPromise
}
