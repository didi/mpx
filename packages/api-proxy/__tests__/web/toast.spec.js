import '@testing-library/jest-dom/extend-expect'
import {
  showToast, hideToast
} from '../../src/platform/api/toast/index.web'

describe('test toast', () => {
  afterAll(() => {
    document.body.lastChild && document.body.lastChild.remove()
  })

  test('should show normal toast', done => {
    const text = 'title'
    const success = jest.fn()
    const complete = jest.fn()

    jest.useFakeTimers()

    showToast({
      title: text,
      success,
      complete
    })

    const toast = document.body.lastChild
    const mask = toast.firstChild
    const icon = toast.lastChild.firstChild
    const title = toast.lastChild.lastChild
    expect(success.mock.calls.length).toBe(1)
    expect(success.mock.calls[0][0].errMsg).toBe('showToast:ok')
    expect(complete.mock.calls.length).toBe(1)

    // default duration is 1500ms
    setTimeout(() => {
      expect(toast).toHaveAttribute('class', expect.stringContaining('show'))
      expect(mask).toHaveAttribute('class', expect.not.stringContaining('show'))
      expect(toast.childNodes.length).toBe(2)
      expect(icon).toHaveAttribute('class', expect.stringContaining('success'))
      expect(title).toHaveTextContent(text)
    }, 1000)
    setTimeout(() => {
      expect(toast).toHaveAttribute('class', expect.not.stringContaining('show'))
      done()
    }, 2500)
    jest.runAllTimers()
  })

  test('should show image', () => {
    const text = 'title'
    const success = jest.fn()
    const complete = jest.fn()

    showToast({
      title: text,
      image: 'img.png',
      success,
      complete
    })

    const toast = document.body.lastChild
    const icon = toast.lastChild.firstChild

    expect(icon).toHaveAttribute('class', expect.not.stringContaining('hide'))
    expect(icon).toHaveAttribute('class', expect.not.stringContaining('success'))
    expect(icon).toHaveAttribute('class', expect.not.stringContaining('loading'))
    expect(icon).toHaveAttribute(
      'style',
      expect.stringContaining(`background-image: url(${'img.png'})`)
    )
  })

  test('should show loading', () => {
    const text = 'title'
    const success = jest.fn()
    const complete = jest.fn()

    showToast({
      title: text,
      icon: 'loading',
      success,
      complete
    })

    const toast = document.body.lastChild
    const icon = toast.lastChild.firstChild

    expect(icon).toHaveAttribute('class', expect.stringContaining('__mpx_loading_wrapper__'))
  })

  test('should show mask', done => {
    const text = 'title'
    const success = jest.fn()
    const complete = jest.fn()

    showToast({
      title: text,
      mask: true,
      success,
      complete
    })

    const toast = document.body.lastChild
    const mask = toast.firstChild
    expect(mask).toHaveAttribute('class', expect.stringContaining('show'))
    done()
  })

  test('should hide toast', () => {
    const success = jest.fn()
    const complete = jest.fn()

    showToast({
      title: 'toast',
      mask: true
    })
    // hideToast 之后会从dom中移除，这里先添加变量
    const toast = document.body.lastChild
    jest.useFakeTimers()
    hideToast({
      success,
      complete
    })
    jest.runAllTimers()
    expect(toast).toHaveAttribute('class', expect.not.stringContaining('show'))
    expect(success.mock.calls.length).toBe(1)
    expect(success.mock.calls[0][0].errMsg).toBe('hideToast:ok')
    expect(complete.mock.calls.length).toBe(1)
  })
})
