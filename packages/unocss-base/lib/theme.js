const baseSize = {
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
  '7xl': '3000rpx',
  prose: '65ch'
}

module.exports = {
  fontSize: {
    xs: ['28.125rpx', '37.5rpx'],
    sm: ['32.8125rpx', '46.875rpx'],
    base: ['37.5rpx', '56.25rpx'],
    lg: ['42.1875rpx', '65.625rpx'],
    xl: ['46.875rpx', '65.625rpx'],
    '2xl': ['56.25rpx', '75rpx'],
    '3xl': ['70.3125rpx', '84.375rpx'],
    '4xl': ['84.375rpx', '93.75rpx'],
    '5xl': ['112.5rpx', '1'],
    '6xl': ['140.625rpx', '1'],
    '7xl': ['168.75rpx', '1'],
    '8xl': ['225rpx', '1'],
    '9xl': ['300rpx', '1']
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
  },
  textStrokeWidth: {
    DEFAULT: '56.25rpx',
    none: '0',
    sm: 'thin',
    md: 'medium',
    lg: 'thick'
  },
  spacing: {
    DEFAULT: '37.5rpx',
    none: '0',
    xs: '28.125rpx',
    sm: '32.8125rpx',
    lg: '42.1875rpx',
    xl: '46.875rpx',
    '2xl': '56.25rpx',
    '3xl': '70.3125rpx',
    '4xl': '84.375rpx',
    '5xl': '112.5rpx',
    '6xl': '140.625rpx',
    '7xl': '168.75rpx',
    '8xl': '225rpx',
    '9xl': '300rpx',
    // windicss
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
    none: '0',
    sm: '4.6875rpx',
    md: '14.0625rpx',
    lg: '18.75rpx',
    xl: '28.125rpx',
    '2xl': '37.5rpx',
    '3xl': '56.25rpx',
    full: '9999px'
  },
  width: {
    auto: 'auto',
    ...baseSize,
    screen: '100vw'
  },
  maxWidth: {
    none: 'none',
    ...baseSize,
    screen: '100vw'
  },
  height: {
    auto: 'auto',
    ...baseSize,
    screen: '100vh'
  },
  maxHeight: {
    none: 'none',
    ...baseSize,
    screen: '100vh'
  },
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
    // windicss
    3: '.2812.5rpx',
    4: '37.5rpx',
    5: '46.875rpx',
    6: '56.25rpx',
    7: '65.625rpx',
    8: '75rpx',
    9: '84.375rpx',
    10: '93.75rpx'
  }
}
