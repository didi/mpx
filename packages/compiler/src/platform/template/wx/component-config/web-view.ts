const TAG_NAME = 'web-view'

export default function () {
  return {
    test: TAG_NAME,
    web (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-web-view'
    }
  }
}
