export default function through (onData) {
  let dataCb = null

  return {
    on: function (name, callback) {
      if (name === 'data') {
        dataCb = callback
      }
    },
    end: function (data) {
      onData(data)
    },
    queue: function (data) {
      if (dataCb) {
        dataCb(data)
      }
    }
  }
}
