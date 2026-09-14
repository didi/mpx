const fs = require('fs')
const vm = require('vm')
const path = require('path')
const source = fs.readFileSync(path.join(__dirname, '../outputs/promo-card.mpx'), 'utf8')
const script = source.match(/<script>([\s\S]*?)<\/script>/)[1]
function component (renderer) {
  let options
  const cancelAnimation = jest.fn()
  const worklet = {
    shared: value => ({ value }),
    timing: (value, config) => ({ value, config }),
    repeat: (animation, count, reverse) => ({ animation, count, reverse }),
    cancelAnimation,
    Easing: { ease: 'ease', linear: 'linear' }
  }
  const animation = { scale: jest.fn().mockReturnThis(), opacity: jest.fn().mockReturnThis(), step: jest.fn().mockReturnThis(), export: () => ({ exported: true }) }
  const wx = { worklet, createAnimation: jest.fn(() => animation) }
  vm.runInNewContext(script.replace(/import[^\n]+/, ''), { createComponent: value => { options = value }, wx })
  const instance = Object.assign({ renderer, applyAnimatedStyle: jest.fn() }, options.data, options.methods)
  options.attached.call(instance)
  options.ready.call(instance)
  return { instance, options, wx, animation }
}
test('Skyline pulse repeats every second without reverse and binds animated styles', () => {
  const { instance } = component('skyline')
  expect(instance.applyAnimatedStyle).toHaveBeenCalledTimes(2)
  expect(instance._promoMotion.pulse.value).toEqual({ animation: { value: 1, config: { duration: 1000, easing: 'ease' } }, count: -1, reverse: false })
})
test('press and release use 150ms and exact target values', () => {
  const { instance } = component('skyline')
  instance.press()
  expect(instance._promoMotion.scale.value).toEqual({ value: 0.96, config: { duration: 150, easing: 'linear' } })
  expect(instance._promoMotion.opacity.value.value).toBe(0.7)
  instance.release()
  expect(instance._promoMotion.scale.value.value).toBe(1)
  expect(instance._promoMotion.opacity.value.value).toBe(1)
  expect(source).toContain('bindtouchcancel="release"')
})
test('detach cancels all three shared animations', () => {
  const { instance, options, wx } = component('skyline')
  options.detached.call(instance)
  expect(wx.worklet.cancelAnimation).toHaveBeenCalledTimes(3)
  expect(instance._promoMotion).toBeNull()
})
test('WebView uses original animation API and skips worklet initialization', () => {
  const { instance, wx, animation } = component('webview')
  expect(instance.applyAnimatedStyle).not.toHaveBeenCalled()
  instance.press()
  expect(wx.createAnimation).toHaveBeenCalledWith({ duration: 150 })
  expect(animation.scale).toHaveBeenCalledWith(0.96)
  instance.release()
  expect(animation.opacity).toHaveBeenLastCalledWith(1)
})
test('SVG preserved byte for byte and component JSON parses', () => {
  const original = '/Users/hjw/project/mpx/.agents/skills/mpx2skyline-workspace/iteration-3/eval-3-inline-animation/input/logo.svg'
  expect(fs.readFileSync(path.join(__dirname, '../outputs/logo.svg'), 'utf8')).toBe(fs.readFileSync(original, 'utf8'))
  expect(JSON.parse(source.match(/<script type="application\/json">([\s\S]*?)<\/script>/)[1]).component).toBe(true)
})
