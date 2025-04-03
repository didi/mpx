const normalize = require('../utils/normalize')
const optionProcessorPath = normalize.lib('runtime/optionProcessorReact')
const { buildPagesMap, buildComponentsMap, getRequireScript, buildGlobalParams, stringifyRequest } = require('./script-helper')

module.exports = function (script, {
  loaderContext,
  ctorType,
  srcMode,
  moduleId,
  isProduction,
  jsonConfig,
  outputPath,
  builtInComponentsMap,
  localComponentsMap,
  localPagesMap,
  componentGenerics,
  genericsInfo
}, callback) {
  let scriptSrcMode = srcMode
  const mode = loaderContext.getMpx().mode
  if (script) {
    scriptSrcMode = script.mode || scriptSrcMode
  } else {
    script = { tag: 'script' }
  }

  let output = '/* script */\n'
  if (ctorType === 'app') {
    output += `
import { getComponent } from ${stringifyRequest(loaderContext, optionProcessorPath)}
import { NavigationContainer, StackActions } from '@react-navigation/native'
${mode === 'ios' ? "import { createNativeStackNavigator as createStackNavigator } from '@react-navigation/native-stack'" : "import { createStackNavigator } from '@react-navigation/stack'"}
import PortalHost from '@mpxjs/webpack-plugin/lib/runtime/components/react/dist/mpx-portal/portal-host'
import { useHeaderHeight } from '@react-navigation/elements';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

global.__navigationHelper = {
  NavigationContainer: NavigationContainer,
  createStackNavigator: createStackNavigator,
  useHeaderHeight: useHeaderHeight,
  StackActions: StackActions,
  GestureHandlerRootView: GestureHandlerRootView,
  PortalHost: PortalHost,
  SafeAreaProvider: SafeAreaProvider,
  useSafeAreaInsets: useSafeAreaInsets
}\n`
    const { pagesMap, firstPage } = buildPagesMap({
      localPagesMap,
      loaderContext,
      jsonConfig
    })
    const componentsMap = buildComponentsMap({
      localComponentsMap,
      loaderContext,
      jsonConfig
    })
    output += buildGlobalParams({ moduleId, scriptSrcMode, loaderContext, isProduction, ctorType, jsonConfig, componentsMap, pagesMap, firstPage })
    output += getRequireScript({ ctorType, script, loaderContext })
    output += `export default global.__mpxOptionsMap[${JSON.stringify(moduleId)}]\n`
  } else {
    // RN环境暂不支持异步加载
    // output += 'import { lazy } from \'react\'\n'
    output += `import { getComponent } from ${stringifyRequest(loaderContext, optionProcessorPath)}\n`
    // 获取组件集合
    const componentsMap = buildComponentsMap({
      localComponentsMap,
      builtInComponentsMap,
      loaderContext,
      jsonConfig
    })

    output += buildGlobalParams({ moduleId, scriptSrcMode, loaderContext, isProduction, ctorType, jsonConfig, componentsMap, outputPath, genericsInfo, componentGenerics })
    output += getRequireScript({ ctorType, script, loaderContext })

    output += `export default global.__mpxOptionsMap[${JSON.stringify(moduleId)}]\n`
  }

  callback(null, {
    output
  })
}
