import '@testing-library/jest-dom/extend-expect'
import {
  showToast, hideToast
} from '../src/api/interactive/index'

describe('test toast', () => {
  afterAll(() => {
    document.body.lastChild.remove()
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
    expect(success.mock.calls[0][0]['errMsg']).toBe('showToast:ok')
    expect(complete.mock.calls.length).toBe(1)

    setTimeout(() => {
      expect(toast).toHaveAttribute('class', expect.stringContaining('show'))
      expect(mask).toHaveAttribute('class', expect.not.stringContaining('show'))
      expect(toast.childNodes.length).toBe(2)
      expect(icon).toHaveAttribute('class', expect.stringContaining('success'))
      expect(title).toHaveTextContent(text)
    }, 1500)
    setTimeout(() => {
      expect(toast).toHaveAttribute('class', expect.not.stringContaining('show'))
      done()
    }, 2500)

    jest.runAllTimers()
    expect(setTimeout).toHaveBeenCalledTimes(3)
  })

  test('should show image', done => {
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
    expect(icon).toHaveAttribute(
      'style',
      expect.stringContaining(`background-image: url(${'img.png'})`)
    )
    done()
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
    jest.useFakeTimers()
    hideToast({
      success,
      complete
    })
    jest.runAllTimers()
    const toast = document.body.lastChild
    expect(toast).toHaveAttribute('class', expect.not.stringContaining('show'))
    expect(success.mock.calls.length).toBe(1)
    expect(success.mock.calls[0][0]['errMsg']).toBe('hideToast:ok')
    expect(complete.mock.calls.length).toBe(1)
  })
})
