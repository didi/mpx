const tShirtScale = {
  xs: '750rpx',
  sm: '900rpx',
  md: '1050rpx',
  lg: '1200rpx',
  xl: '1350rpx',
  '2xl': '1575rpx',
  '3xl': '1800rpx',
  '4xl': '2100rpx',
  '5xl': '2400rpx',
  '6xl': '2700rpx',
  '7xl': '3000rpx'
}

module.exports = {
  theme: {
    extend: {
      spacing: {
        0.5: '4.6875rpx',
        1: '9.375rpx',
        1.5: '14.0625rpx',
        2: '18.75rpx',
        2.5: '23.4375rpx',
        3: '28.125rpx',
        3.5: '32.8125rpx',
        4: '37.5rpx',
        5: '46.875rpx',
        6: '56.25rpx',
        7: '65.625rpx',
        8: '75rpx',
        9: '84.375rpx',
        10: '93.75rpx',
        11: '103.125rpx',
        12: '112.5rpx',
        14: '131.25rpx',
        16: '150rpx',
        20: '187.5rpx',
        24: '225rpx',
        28: '262.5rpx',
        32: '300rpx',
        36: '337.5rpx',
        40: '375rpx',
        44: '412.5rpx',
        48: '450rpx',
        52: '487.5rpx',
        56: '525rpx',
        60: '562.5rpx',
        64: '600rpx',
        72: '675rpx',
        80: '750rpx',
        96: '900rpx'
      },
      borderRadius: {
        DEFAULT: '9.375rpx',
        sm: '4.6875rpx',
        md: '14.0625rpx',
        lg: '18.75rpx',
        xl: '28.125rpx',
        '2xl': '37.5rpx',
        '3xl': '56.25rpx'
      },
      columns: {
        ...tShirtScale,
        '3xs': '600rpx',
        '2xs': '675rpx'
      },
      fontSize: {
        xs: ['28.125rpx', { lineHeight: '37.5rpx' }],
        sm: ['32.8125rpx', { lineHeight: '46.875rpx' }],
        base: ['37.5rpx', { lineHeight: '56.25rpx' }],
        lg: ['42.1875rpx', { lineHeight: '65.625rpx' }],
        xl: ['46.875rpx', { lineHeight: '65.625rpx' }],
        '2xl': ['56.25rpx', { lineHeight: '75rpx' }],
        '3xl': ['70.3125rpx', { lineHeight: '84.375rpx' }],
        '4xl': ['84.375rpx', { lineHeight: '93.75rpx' }],
        '5xl': ['112.5rpx', { lineHeight: '1' }],
        '6xl': ['140.625rpx', { lineHeight: '1' }],
        '7xl': ['168.75rpx', { lineHeight: '1' }],
        '8xl': ['225rpx', { lineHeight: '1' }],
        '9xl': ['300rpx', { lineHeight: '1' }]
      },
      height: {
        ...tShirtScale
      },
      maxHeight: {
        ...tShirtScale
      },
      maxWidth: {
        ...tShirtScale
      },
      perspective: {
        ...tShirtScale
      },
      width: {
        ...tShirtScale
      },
      lineHeight: {
        3: '.2812.5rpx',
        4: '37.5rpx',
        5: '46.875rpx',
        6: '56.25rpx',
        7: '65.625rpx',
        8: '75rpx',
        9: '84.375rpx',
        10: '93.75rpx'
      },
      textIndent: {
        DEFAULT: '56.25rpx',
        xs: '18.75rpx',
        sm: '37.5rpx',
        md: '56.25rpx',
        lg: '75rpx',
        xl: '93.75rpx',
        '2xl': '112.5rpx',
        '3xl': '150rpx'
      }
    }
  }
}
