import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react-native'
import { RouteContext, FormContext } from '../../lib/runtime/components/react/context'

// Mock contexts
const mockRouteContext = {
  pageId: 'test-page'
}

const mockFormContext = {
  submit: jest.fn(),
  reset: jest.fn()
}

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <RouteContext.Provider value={mockRouteContext}>
      <FormContext.Provider value={mockFormContext}>
        {children}
      </FormContext.Provider>
    </RouteContext.Provider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Helper function to create mock events
export const createMockEvent = (type: string, data: any = {}) => ({
  nativeEvent: {
    ...data,
    type
  },
  preventDefault: jest.fn(),
  stopPropagation: jest.fn()
})

// Helper function to create mock layout events
export const createMockLayoutEvent = (width = 100, height = 100) => ({
  nativeEvent: {
    layout: {
      x: 0,
      y: 0,
      width,
      height
    }
  }
})

// Helper to mock Image.getSize
export const mockImageGetSize = (width = 100, height = 100) => {
  const mockGetSize = jest.fn((uri, success) => {
    success(width, height)
  })
  
  // Mock react-native Image component
  jest.doMock('react-native', () => ({
    ...jest.requireActual('react-native'),
    Image: {
      ...jest.requireActual('react-native').Image,
      getSize: mockGetSize
    }
  }))
  
  return mockGetSize
}

// Re-export everything
export * from '@testing-library/react-native'

// Override render method
export { customRender as render }

// Export mock contexts for direct use
export { mockRouteContext, mockFormContext }
