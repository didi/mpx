const BEHAVIORS_MAP = {
  'wx://form-field': 'ks://form-field',
  'wx://form-field-group': 'ks://form-field-group',
  'wx://form-field-button': 'ks://form-field-button',
  'wx://component-export': 'ks://component-export'
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