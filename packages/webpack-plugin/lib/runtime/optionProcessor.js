export default function processOption (
  option,
  ctorType,
  importedPagesMap,
  importedComponentsMap,
  Vue,
  VueRouter
) {

  if (ctorType === 'app') {
    for (var componentName in importedComponentsMap) {
      if(importedComponentsMap.hasOwnProperty(componentName)){
        var componentVar = importedComponentsMap[componentName]

      }


    }


  } else {
    if (jsonConfig.usingComponents) {

    }
  }
}
