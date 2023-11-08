function promisify (obj = {}, callback) {
  return new Promise((resolve, reject) => {
    const originSuccess = obj.success
    const originFail = obj.fail
    obj.success = function (res) {
      originSuccess && originSuccess.call(this, res)
      resolve(res)
    }
    obj.fail = function (e) {
      originFail && originFail.call(this, e)
      reject(e)
    }
    if (callback) {
      callback(obj)
    }
  })
}

export default promisify
