function nextTick (cb) {
  if (typeof Promise !== 'undefined') {
    Promise.resolve().then(cb)
  } else {
    setTimeout(cb, 0)
  }
}

export {
  nextTick
}
