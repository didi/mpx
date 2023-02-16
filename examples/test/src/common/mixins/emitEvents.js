export default {
  methods: {
    emitEvent (e = {}) {
      const value = e.detail
      this.triggerEvent('toggle', value)
    }
  }
}
