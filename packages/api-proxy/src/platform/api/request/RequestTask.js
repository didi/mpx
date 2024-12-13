class RequestTask {
  constructor (abortCb) {
    this._abortCb = abortCb
  }

  abort () {
    if (typeof this._abortCb === 'function') {
      this._abortCb()
    }
  }
}

export default RequestTask
