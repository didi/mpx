/// <reference types="jest" />

let mockPortals: Array<{
  key: number
  children: string
  stackPath?: number[]
  order: number
}> = []

jest.mock('react-native', () => ({
  StyleSheet: {
    absoluteFillObject: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
    create: (styles: any) => styles
  },
  View: 'View'
}), { virtual: false })

jest.mock('react', () => {
  const actual = jest.requireActual('react')
  return {
    ...actual,
    useState: () => [{ portals: mockPortals }, () => undefined],
    useRef: (init: any) => ({ current: init }),
    useCallback: (fn: Function) => fn,
    useImperativeHandle: () => undefined
  }
})

// eslint-disable-next-line import/first
import PortalManager from '../../../lib/runtime/components/react/mpx-portal/portal-manager'

const getRenderedOrder = () => {
  const element = (PortalManager as any).render({}, null)
  return element.props.children.map((fragment: any) => fragment.props.children.props.children)
}

describe('PortalManager stackPath ordering', () => {
  test('renders a default-zIndex nested fixed portal above its parent', () => {
    mockPortals = [
      { key: 1, children: 'inner', stackPath: [0, 0], order: 0 },
      { key: 2, children: 'outer', stackPath: [0], order: 1 }
    ]

    expect(getRenderedOrder()).toEqual(['outer', 'inner'])
  })
})
