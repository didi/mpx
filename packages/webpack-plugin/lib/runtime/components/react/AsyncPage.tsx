import { Suspense, ReactNode } from 'react'
import ErrorBoundary from './AsyncErrorBoundary'
import usePageLayoutEffect from './usePageLayoutEffectReact'
import { View, Text, StyleSheet } from 'react-native'

interface SimpleLoadingIndicatorProps {
  text?: string
}

const SimpleLoadingIndicator = ({ text = '加载中...' }: SimpleLoadingIndicatorProps) => {
  return (
    <View style={styles.container}>
      {/* <ActivityIndicator size="large" color="#0a7ea4" style={styles.spinner} /> */}
      <Text style={styles.text}>{text}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff' // 白色背景
  },
  spinner: {
    marginBottom: 10
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333' // 深灰色文字
  }
})

interface AsyncPageProps {
  children: ReactNode
  fallback: ReactNode
  loading: ReactNode
  navigation: Object
}

const AsyncPage = (props: AsyncPageProps) => {
  const pageConfig = global.__mpxPageConfig || {}
  usePageLayoutEffect(props.navigation, pageConfig)
  return (
    <ErrorBoundary asyncType='page' fallback={props.fallback || <SimpleLoadingIndicator text="点击重试"></SimpleLoadingIndicator>}>
      <Suspense fallback={props.loading || <SimpleLoadingIndicator></SimpleLoadingIndicator>}>
        {props.children}
      </Suspense>
    </ErrorBoundary>
  )
}

AsyncPage.displayName = 'AsyncPageContainer'

export default AsyncPage
