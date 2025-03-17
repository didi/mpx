import * as React from 'react'
import { View, Text } from 'react-native'

// todo any
interface PropsType {
  fallback: React.ComponentType<any>
  asyncType: 'component' | 'page'
  children: React.ReactNode
}

interface StateType {
  hasError: boolean,
  key: number
}

interface ComponentError extends Error {
  request?: string
}

export default class ErrorBoundary extends React.Component<PropsType, StateType> {
  constructor (props: PropsType) {
    super(props)
    this.state = {
      hasError: false,
      key: 0
    }
  }

  // render 阶段收集到的错误
  static getDerivedStateFromError (error: ComponentError): StateType | undefined {
    if (error.name === 'ChunkLoadError') {
      return {
        hasError: true,
        key: 0
      }
    }
  }

  reloadPage () {
    this.setState((prevState) => {
      return {
        hasError: false,
        key: prevState.key + 1
      }
    })
  }

  render () {
    const { fallback: Fallback, asyncType } = this.props
    if (this.state.hasError) {
      if (asyncType === 'page') {
        return <Fallback onReload={this.reloadPage.bind(this)}></Fallback>
      } else if (asyncType === 'component') {
        return (<Fallback></Fallback>)
      }
    } else {
      return (
        <React.Fragment key={this.state.key}>
          {this.props.children}
        </React.Fragment>
      )
    }
  }
}
