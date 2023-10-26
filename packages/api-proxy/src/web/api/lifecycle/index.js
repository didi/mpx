function getEnterOptionsSync () {
  const current = global.__mpxFirstRoute || {}
  return {
    path: current.path && current.path.replace(/^\//, ''),
    query: current.query,
    scene: 0,
    shareTicket: '',
    referrerInfo: {}
  }
}

export {
  getEnterOptionsSync
}
