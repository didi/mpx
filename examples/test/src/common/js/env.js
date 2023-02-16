export const isWebBundle = __mpx_mode__ === 'web'
export const isWechatMiniprogram = __mpx_mode__ === 'wx'
export const isRainbow = isWebBundle && !!navigator.userAgent.match(/didi.rainbow\/([\d.]+)/i)
