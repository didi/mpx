const TAG_NAME = 'movable-area'

export default function ({ print }) {
  return {
    test: TAG_NAME,
    web (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-movable-area'
    }
  }
}
