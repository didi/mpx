function nextTick (cb) {
  if (typeof Promise !== 'undefined' && isNative(Promise)) {
    Promise.resolve().then(cb)
  } else {
    setTimeout(cb, 0)
  }
}

export {
  nextTick
}
