import React from 'react'
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'

interface SimpleLoadingIndicatorProps {
  text?: string
}

export default function SimpleLoadingIndicator({
  text = '加载中...'
}: SimpleLoadingIndicatorProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#0a7ea4" style={styles.spinner} />
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
