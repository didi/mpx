export const recordPerformance = (startTime: number, componentName: string) => {
 let performanceData = global.performanceData
 if (performanceData[componentName]) {
    performanceData[componentName].duration += new Date().getTime() - startTime
    performanceData[componentName].count += 1
  } else {
    performanceData[componentName] = {}
    performanceData[componentName].duration = new Date().getTime() - startTime
    performanceData[componentName].count = 1
  }
}