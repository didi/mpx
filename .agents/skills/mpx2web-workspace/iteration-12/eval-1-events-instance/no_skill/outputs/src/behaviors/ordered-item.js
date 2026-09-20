const orderedItemDefinition = {
  properties: { label: String },
  methods: {
    getLabel () { return this.label }
  }
}

// Behavior is supplied by mini-program runtimes. Mpx Web consumes the same
// definition as a behavior object, so keep the portable definition as the
// fallback when the native constructor is not present.
const orderedItem = typeof Behavior === 'function'
  ? Behavior(orderedItemDefinition)
  : orderedItemDefinition

export default orderedItem
