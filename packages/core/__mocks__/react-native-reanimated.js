const createTiming = (name) => (...args) => ({
  name,
  args,
  normalize () {
    return { name, args }
  },
  toString () {
    return `${name}(${args.join(', ')})`
  }
})

module.exports = {
  steps: createTiming('steps'),
  linear: createTiming('linear'),
  cubicBezier: createTiming('cubic-bezier')
}

