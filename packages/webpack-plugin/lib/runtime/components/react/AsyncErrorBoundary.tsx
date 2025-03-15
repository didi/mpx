import * as React from 'react'
import { View, Text } from 'react-native'

interface PropsType {
  fallback?: React.ReactNode | React.JSX.Element
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

  reloadPage = () => {
    this.setState((prevState) => {
      return {
        hasError: false,
        key: prevState.key + 1
      }
    })
  }

  render () {
    const { fallback: Fallback } = this.props
    if (this.state.hasError) {
      if (this.props.asyncType === 'page') {
        if (this.props.fallback) {
          return this.props.fallback
        } else {
          return (
            <View>
              <Text onPress={this.reloadPage}>页面加载失败，请点击重试</Text>
            </View>
          )
        }
      } else if (this.props.asyncType === 'component') {
        return this.props.fallback
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
