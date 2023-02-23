const TAG_NAME = 'radio-group'

export default function () {
  return {
    test: TAG_NAME,
    web (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-radio-group'
    }
  }
}
