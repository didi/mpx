import '@testing-library/jest-dom/extend-expect'
import {
  showToast
} from '../src/api/interactive/index'

describe('test toast', () => {
  test('normal show', done => {
    const text = 'title'
    const success = jest.fn()
    const complete = jest.fn()

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

    setTimeout(() => {
      expect(toast).toHaveAttribute('class', expect.stringContaining('show'))
      expect(mask).toHaveAttribute('class', expect.not.stringContaining('show'))
      expect(toast.childNodes.length).toBe(2)
      expect(icon).toHaveAttribute('class', expect.stringContaining('hide'))
      expect(title).toHaveTextContent(text)
    }, 1500)
    setTimeout(() => {
      expect(toast).toHaveAttribute('class', expect.not.stringContaining('show'))
      done()
    }, 2500)
  })
})
