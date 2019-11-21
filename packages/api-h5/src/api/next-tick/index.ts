export function isNative (Ctor: any): boolean {
  return typeof Ctor === 'function' && /native code/.test(Ctor.toString())
}

function nextTick (cb: (...args: any) => any) {
  if (typeof Promise !== 'undefined' && isNative(Promise)) {
    Promise.resolve().then(cb)
  } else if (
    typeof MessageChannel !== 'undefined' &&
    (isNative(MessageChannel) ||
    // PhantomJS
    MessageChannel.toString() === '[object MessageChannelConstructor]')
  ) {
    const channel = new MessageChannel()
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
