import { ComponentType, ReactNode, Component, Fragment, Suspense, ErrorInfo } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff'
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333'
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
    marginBottom: 20
  },
  reloadButton: {
    backgroundColor: '#9E9E9E',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 10
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center'
  }
})

type AsyncType = 'page' | 'component'

interface PropsType<T extends AsyncType> {
  fallback: T extends 'page' ? ComponentType<DefaultFallbackProps> : ReactNode
  loading?: ComponentType<any>
  type: T
  children: ReactNode
}

interface StateType {
  hasError: boolean,
  key: number
}

interface ComponentError extends Error {
  request?: string
}

interface DefaultLoadingProps {
  text?: string
}

const DefaultLoading = ({ text = '加载中...' }: DefaultLoadingProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{text}</Text>
    </View>
  )
}

interface DefaultFallbackProps {
  onReload: () => void
}

const DefaultFallback = ({ onReload }: DefaultFallbackProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.errorText}>网络无法连接</Text>
      <TouchableOpacity
        style={styles.reloadButton}
        onPress={onReload}
        activeOpacity={0.7}
      >
        <Text style={styles.buttonText}>重新加载</Text>
      </TouchableOpacity>
    </View>
  )
}

export default class AsyncContainer extends Component<PropsType<AsyncType>, StateType> {
  private suspenseFallback: ReactNode
  private errorFallback: ReactNode

  constructor (props: PropsType<AsyncType>) {
    super(props)
    this.state = {
      hasError: false,
      key: 0
    }
    this.suspenseFallback = this.getSuspenseFallback()
    this.errorFallback = this.getErrorFallback()
  }

  // render 阶段收集到的错误
  static getDerivedStateFromError (error: ComponentError): StateType | undefined {
    if (error.name === 'ChunkLoadError') {
      return {
        hasError: true,
        key: 0
      }
    }
    return undefined
  }

  reloadPage () {
    this.setState((prevState) => {
      return {
        hasError: false,
        key: prevState.key + 1
      }
    })
  }

  getSuspenseFallback () {
    if (this.props.type === 'page') {
      const Fallback = this.props.loading || DefaultLoading
      return <Fallback />
    } else {
      return this.props.fallback as ReactNode
    }
  }

  getErrorFallback () {
    if (this.props.type === 'page') {
      const Fallback = this.props.fallback as ComponentType<DefaultFallbackProps> || DefaultFallback
      return <Fallback onReload={this.reloadPage.bind(this)}></Fallback>
    } else {
      return this.props.fallback as ReactNode
    }
  }

  render () {
    if (this.state.hasError) {
      return this.errorFallback
    } else {
      return (
        <Fragment key={this.state.key}>
          <Suspense fallback={this.suspenseFallback}>
            {this.props.children}
          </Suspense>
        </Fragment>
      )
    }
  }
}
