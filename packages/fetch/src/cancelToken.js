export default class CancelToken {
  constructor () {
    this.token = new Promise(resolve => {
      this.resolve = resolve
    })
  }
  exec (msg) {
    this.resolve && this.resolve(msg)
  }
}
