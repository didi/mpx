const blockOverflows = [
  (raw) => {
    const reg = /^(?:overflow|of)-(.+)$/
    const match = raw.match(reg)
    if (match && !['hidden', 'visible', 'scroll'].includes(match[1])) {
      return true
    }
  },
  /^(?:overflow|of)-([xy])-(.+)$/
]

export { blockOverflows }
