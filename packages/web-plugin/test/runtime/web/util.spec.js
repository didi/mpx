import { processSize } from '../../../lib/runtime/components/web/util'

describe('util case set', function () {
  it('should process size success with number and string', function () {
    delete global.window.screen
    global.window.screen = { width: 375 }
    expect(processSize('750rpx')).toBe(375)
    expect(processSize('150px')).toBe(150)
    expect(processSize(50)).toBe(50)
    expect(processSize('axasdg')).toBe(0)
    expect(processSize('axasdg', { default: 20 })).toBe(20)
  })
})
