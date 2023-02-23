const TAG_NAME = 'checkbox-group'

export default function () {
  return {
    test: TAG_NAME,
    web (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-checkbox-group'
    }
  }
}
