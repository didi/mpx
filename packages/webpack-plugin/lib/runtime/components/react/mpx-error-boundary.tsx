import * as React from 'react'

interface PropsType {
  fallback: React.ReactNode
  children: React.ReactNode
}

interface StateType {
  hasError: boolean
}

export default class ErrorBoundary extends React.Component<PropsType, StateType> {
  constructor(props: PropsType) {
    super(props)
    this.state = {
      hasError: false
    }
  }
  static getDerivedStateFromError(error: Error): StateType {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}
