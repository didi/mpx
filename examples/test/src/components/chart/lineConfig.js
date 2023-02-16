export default function getLineConfig (data = [], average, area) {
  console.log(area)
  const ys = data.map(v => v.value && v.value[1]) || []
  const maxY = Math.max(...ys)
  return {
    visualMap: {
      type: 'piecewise',
      top: -9999,
      right: 0,
      pieces: [{
        gt: average,
        lte: maxY > average ? maxY : (average + 1),
        color: '#EA5E1E'
      }],
      outOfRange: {
        color: '#4A90E2'
      },
      formatter (v) {
        return ''
      }
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      axisTick: {
        show: false
      },
      interval: 3,
      name: '时间',
      nameLocation: 'start',
      nameTextStyle: {
        fontFamily: 'PingFangSC-Regular',
        fontSize: 10,
        color: '#7D7D80',
        lineHeight: 11
      },
      nameGap: 6,
      axisLabel: {
        fontFamily: 'PingFangSC-Semibold',
        fontSize: 10,
        color (x) {
          const { value = [] } = data.find(v => v.value[0] === x) || []
          return value[1] > average ? '#EA5E1E' : '#666666'
        },
        margin: 7
      },
      axisLine: {
        lineStyle: {
          color: '#D8D8D8',
          width: 1
        }
      }
    },
    yAxis: {
      type: 'value',
      splitLine: {
        show: false
      },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false },
      name: `分\n时\n单\n量`,
      nameLocation: 'center',
      nameTextStyle: {
        fontFamily: 'PingFangSC-Regular',
        fontSize: 10,
        color: '#7D7D80',
        lineHeight: 11
      },
      nameGap: 6,
      nameRotate: 1,
      min (v) {
        return v.min
      }
    },
    grid: {
      x: 29,
      y: 0,
      x2: 16,
      y2: 16
    },
    series: [{
      name: 'series data',
      data: data.map(v => {
        const [, y] = v.value
        return y > average ? {
          ...v,
          label: {
            show: false
          }
        } : {
          ...v,
          label: {
            show: false
          }
        }
      }),
      type: 'line',
      symbol: 'circle',
      symbolSize: 1,
      lineStyle: {
        width: 5
      },
      markLine: {
        silent: true,
        symbol: ['none', 'none'],
        itemStyle: {
          normal: {
            show: true,
            color: '#1178FF'
          }
        },
        lineStyle: {
          color: '#1178FF',
          type: 'dashed',
          opacity: 0.14
        },
        label: {
          show: false
        },
        data: [{
          yAxis: average
        }]
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [{
            offset: 0, color: '#FFC7AF' // 0% 处的颜色
          }, {
            offset: 1, color: '#FFFFFF' // 100% 处的颜色
          }],
          global: false // 缺省为 false
        },
        origin: 'start'
      }
    }]
  }
}
