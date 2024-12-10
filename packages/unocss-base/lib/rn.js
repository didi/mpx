import presetRn from '../preset-rn/index.js'

export default function presetRnMpx (options = {}) {
  return {
    name: '@mpxjs/unocss-preset-rn',
    ...presetRn,
    theme: {
      letterSpacing: {
        tighter: '-0.5px',
        tight: '-0.25px',
        normal: '0px',
        wide: '0.25px',
        wider: '0.5px',
        widest: '1px'
      }
    }
  }
}
