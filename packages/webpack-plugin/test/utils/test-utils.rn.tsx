import React, { ReactElement } from 'react'
import renderer from 'react-test-renderer'
import { RouteContext, FormContext } from '../../lib/runtime/components/react/context'

// Mock contexts
const mockRouteContext = {
  pageId: 'test-page'
}

const mockFormContext = {
  submit: jest.fn(),
  reset: jest.fn()
}

// Custom render function using react-test-renderer
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <RouteContext.Provider value={mockRouteContext}>
      <FormContext.Provider value={mockFormContext}>
        {children}
      </FormContext.Provider>
    </RouteContext.Provider>
  )
}

export const renderWithRenderer = (ui: ReactElement) => {
  return renderer.create(
    <AllTheProviders>
      {ui}
    </AllTheProviders>
  )
}

// Mock event creators
export const createMockEvent = (type: string, data: any = {}) => ({
  type,
  target: data.target || {},
  currentTarget: data.currentTarget || {},
  nativeEvent: data.nativeEvent || {},
  ...data
})

export const createMockLayoutEvent = (width: number, height: number) => ({
  nativeEvent: {
    layout: {
      x: 0,
      y: 0,
      width,
      height
    }
  }
})

// Export commonly used testing utilities
export { renderer }
export * from 'react-test-renderer'
