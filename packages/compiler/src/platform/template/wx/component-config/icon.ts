const TAG_NAME = 'icon'

export default function () {
  return {
    test: TAG_NAME,
    web (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-icon'
    }
  }
}
