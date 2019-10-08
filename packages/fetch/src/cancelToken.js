export default class CancelToken {
  constructor () {
    this.token = new Promise(resolve => {
      this.resolve = resolve
    })
  }
  exec (msg) {
    return new Promise(resolve => {
      this.resolve && this.resolve(msg)
      resolve()
    })
  }
}
