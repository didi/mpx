
class RequestTask {
  constructor (abortCb) {
    this._abortCb = abortCb
  }
  abort () {
    if (typeof this.abortCb === 'function') {
      this._abortCb()
    }
  }
}

export default RequestTask
