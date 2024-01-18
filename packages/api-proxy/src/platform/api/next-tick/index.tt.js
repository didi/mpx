function nextTick (fn) {
  Promise.resolve().then(fn)
}

export {
  nextTick
}
