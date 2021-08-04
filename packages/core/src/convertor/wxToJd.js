const BEHAVIORS_MAP = {
  'wx://form-field': 'jd://form-field',
  'wx://component-export': 'jd://component-export'
}

export default {
  convert (options) {
    if (options.behaviors) {
      options.behaviors.forEach((behavior, idx) => {
        if (typeof behavior === 'string' && BEHAVIORS_MAP[behavior]) {
          options.behaviors.splice(idx, 1, BEHAVIORS_MAP[behavior])
        }
      })
    }
  }
}
