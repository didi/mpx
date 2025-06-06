import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { NavigationContainer } from '@react-navigation/native'
import PortalHost from '@mpxjs/webpack-plugin/lib/runtime/components/react/dist/mpx-portal/portal-host'
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

export {
  createNativeStackNavigator,
  NavigationContainer,
  GestureHandlerRootView,
  PortalHost,
  SafeAreaProvider,
  useSafeAreaInsets
}
