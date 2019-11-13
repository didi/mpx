
class RequestTask {
  abortCb: (...args: any[]) => any
  constructor (abortCb) {
    this.abortCb = abortCb
  }
  abort () {
    if (typeof this.abortCb === 'function') {
      this.abortCb()
    }
  }
}

export default RequestTask
