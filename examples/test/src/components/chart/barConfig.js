import * as echarts from 'echarts/core'
export default function getBarConfig (data = [], average, area) {
  return {
    legend: {
      show: false
    },
    xAxis: {
      type: 'category',
      axisTick: {
        show: false
      },
      axisLabel: {
        fontFamily: 'dinum',
        fontSize: 10,
        lineHeight: 10,
        color: '#7D7D80',
        margin: 7,
        interval: 0
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
      name: '日\n均\n单\n量',
      nameLocation: 'center',
      nameTextStyle: {
        fontFamily: 'PingFangSC-Regular',
        fontSize: 10,
        color: '#7D7D80',
        lineHeight: 11
      },
      nameGap: 6,
      nameRotate: 1
    },
    grid: {
      x: 15,
      y: 31,
      x2: 5,
      y2: 18
    },
    series: [{
      name: 'series data',
      data: data.map(v => {
        const [, y] = v.value
        return y > average ? {
          ...v,
          label: {
            show: false,
            position: 'top'
          },
          itemStyle: {
            color: new echarts.graphic.LinearGradient(
              0, 0, 0, 1,
              [
                { offset: 1, color: '#FF9143' },
                { offset: 0, color: '#FF5303' }
              ]
            ),
            borderRadius: [4, 4, 0, 0]
          }
        } : {
          ...v,
          label: {
            show: false
          },
          itemStyle: {
            borderRadius: [4, 4, 0, 0],
            color: new echarts.graphic.LinearGradient(
              0, 0, 0, 1,
              [
                { offset: 1, color: 'rgba(255,145,67,0.6)', opacity: 0.6 },
                { offset: 0, color: 'rgba(255,83,3,0.6)', opacity: 0.6 }
              ]
            )
          }
        }
      }),
      markPoint: {
        silent: true,
        symbol () {
          return 'image://https://dpubstatic.udache.com/static/dpubimg/8e233ed9-9dc2-45d8-b31b-4f064ff52dba.png'
        },
        symbolSize: [18, 21],
        symbolOffset: [0, -20],
        data: data.filter(v => {
          const [, y] = v.value || {}
          return y > average
        }).map(v => {
          return {
            coord: v.value
          }
        })
      },
      barWidth: 10,
      showBackground: true,
      itemStyle: {
        color: new echarts.graphic.LinearGradient(
          0, 0, 0, 1,
          [
            { offset: 0, color: '#83bff6' },
            { offset: 0.5, color: '#188df0' },
            { offset: 1, color: '#188df0' }
          ]
        )
      },
      backgroundStyle: {
        color: 'rgba(180, 180, 180, 0.2)',
        borderRadius: [4, 4, 0, 0]
      },
      // label: {
      //   formatter(v) {
      //     return '爆'
      //   },
      //   rich: {
      //     img: {
      //     }
      //   }
      // },
      type: 'bar',
      symbol: 'circle',
      symbolSize: 1,
      lineStyle: {
        width: 5
      }
    }, {
      type: 'bar',
      data: [],
      zlevel: -1,
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
          opacity: 0.1
        },
        label: {
          show: false
        },
        data: [{
          yAxis: average
        }]
      }
    }]
  }
}
