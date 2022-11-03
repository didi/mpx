const getWxToTtApi = () => {
  return {
    nextTick (fn) {
      Promise.resolve().then(fn)
    }
  }
}

export default getWxToTtApi
