export function getComponent (component, extendOptions) {
  component = component.__esModule ? component.default : component
  // eslint-disable-next-line
  if (extendOptions) Object.assign(component, extendOptions)
  return component
}

export function createApp ({
  App,
  pagesMap,
  firstPage,
  createElement,
  NavigationContainer,
  createNativeStackNavigator
}) {
  const Stack = createNativeStackNavigator()
  const pages = []
  return () => {
    return createElement(NavigationContainer, null, createElement(Stack.Navigator, null, ...pages))
  }
}
