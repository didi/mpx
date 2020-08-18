export function warn (msg, location, e) {
  return log('warn', msg, location, e)
}

export function error (msg, location, e) {
  return log('error', msg, location, e)
}

function log (type, msg, location, e) {
  if (process.env.NODE_ENV !== 'production') {
    let header = `[Mpx runtime ${type}]: `
    if (location) {
      header = `[Mpx runtime ${type} at ${location}]: `
    }
    console[type](header + msg)
    if (e) console[type](e)
  }
}
