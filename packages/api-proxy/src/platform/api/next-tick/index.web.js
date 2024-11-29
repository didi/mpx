export function isNative (Ctor) {
  return typeof Ctor === 'function' && /native code/.test(Ctor.toString())
}

function nextTick (cb) {
  if (typeof Promise !== 'undefined' && isNative(Promise)) {
    Promise.resolve().then(cb)
  } else if (
    typeof MessageChannel !== 'undefined' &&
    (isNative(window.MessageChannel) ||
    // PhantomJS
    window.MessageChannel.toString() === '[object MessageChannelConstructor]')
  ) {
    const channel = new window.MessageChannel()
    const port = channel.port2
    channel.port1.onmessage = cb
    port.postMessage(1)
  } else {
    setTimeout(cb, 0)
  }
}

export {
  nextTick
}
