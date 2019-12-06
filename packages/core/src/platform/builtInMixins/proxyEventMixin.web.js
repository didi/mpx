export default function proxyEventMixin () {
  const methods = {
    triggerEvent (eventName, eventDetail) {
      return this.$emit(eventName, {
        type: eventName,
        detail: eventDetail
      })
    }
  }

  return {
    methods
  }
}
