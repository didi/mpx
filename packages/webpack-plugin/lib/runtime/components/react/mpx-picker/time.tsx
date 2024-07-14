import { View, Text, Modal, TouchableWithoutFeedback, Dimensions } from 'react-native'
import { PickerView } from '@ant-design/react-native'
import React, { forwardRef, useState, useRef, useEffect } from 'react'
import useNodesRef, { HandlerRef } from '../useNodesRef' // 引入辅助函数
import { TimeProps,  } from './type'

// 可见应用窗口的大小。
// const { height: dHeight, width: dWidth } = Dimensions.get('window');
//  modal属性: {"height": 298.33331298828125, "offsetLeft": 0, "offsetTop": 513.6666870117188, "width": 375, "x": 0, "y": 513.6666870117188}
// const { height: sHeight, width: sWidth } = Dimensions.get('screen');
// 	设备屏幕的大小。 screen

const styles: { [key: string]: Object } = {
  showModal: {
    backgroundColor: "black",
    opacity: 0.5,
    position: "absolute",
    top: 0,
    width: "100%"
  },
  hideModal: {
    opacity: 1
  },
  modal: {
    backgroundColor: "black",
    opacity: 0.5
  },
  centeredView: {
    position: 'absolute',
    bottom: 0,
    width: "100%",
    overflow: 'scroll'
  },
  btnLine: {
    width: "100%",
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    borderColor: 20,
    borderBottomWidth: 1,
    backgroundColor: "white",
    paddingLeft: 20,
    paddingRight: 20
  },
  cancel: {
    height: 50,
    display: "flex",
    justifyContent: 'center'
  },
  ok: {
    height: 50,
    display: "flex",
    justifyContent: 'center'
  },
  oktext: {
    color: 'rgb(255, 0, 0)'
  }
}

function formatStrToInt(timestr: string) {
  let [start, end] = timestr.split(':')
  return [parseInt(start), parseInt(end)]
}
// [9, 59] to 09:59
function formatStr(arr) {
  let [hour, minute] = arr
  if (hour < 10) {
    hour = '0' + hour
  }
  if (minute < 10) {
    minute = '0' + minute
  }
  return hour + ':' + minute
}
function generateMinute(sminute: number, eminute: number) {
  let startminute = sminute || 1

  let arrMinute: any[] = []
  for (let i = startminute; i <= eminute; i++) {
    let obj = {
      label: i,
      value: i,
      children: []
    }
    arrMinute.push(obj)
  }
  return arrMinute
}

function generateColumns(start: string, end: string): any[] {
  let [starthour, startminute]: any = formatStrToInt(start)
  let [endhour, endminute]: any = formatStrToInt(end)
  let pickData: any[] = []
  for (let i = starthour; i <=endhour; i++) {
    let curEndMinute = 59
    if (i === endhour) {
      curEndMinute = endminute
    }
    let obj = {
      label: i,
      value: i,
      children: generateMinute(i === starthour ? startminute : '', curEndMinute)
    }
    pickData.push(obj)
  }

  return pickData
}
/**
 * [{label:'', value: '', key: '', children: []}]
  label: string | ReactNode
  value: string | number
  key?: string | number
  children?: PickerColumnItem[]
*/

const _TimePicker = forwardRef<HandlerRef<View, TimeProps>, TimeProps>((props: TimeProps, ref): React.JSX.Element => {
  const { children, start, end, value, bindchange, bindcancel, disabled } = props
  const defaultProps = {
    start: '00:10',
    end: '23:59'
  }
  const defaultValue = formatStrToInt(value)
  const [timevalue, setTimeValue] = useState(defaultValue)
  // 存储layout布局信息
  const layoutRef = useRef({})
  const { nodeRef: viewRef } = useNodesRef<View, TimeProps>(props, ref, {})
  // 存储modal的布局信息
  const modalLayoutRef = useRef({})
  const { nodeRef: modalRef } = useNodesRef<View, TimeProps>(props, ref, {})
  const [visible, setVisible] = useState(false)
  const columnData = generateColumns(start || defaultProps.start, end || defaultProps.end)
  const [data, setData] = useState(columnData)
  const [offsetTop, setOffsetTop] = useState(0)

  useEffect(() => {
    const newColumnData = generateColumns(start, end)
    setData(newColumnData)
  }, [start, end])

  useEffect(() => {
    if (value) {
      const nValue = formatStrToInt(value)
      nValue && setTimeValue(nValue)
    }
  }, [value])

  // console.log('---------------visible---', visible, JSON.stringify(columnData))
  const handleModalStatus = (status: boolean) => {
    setVisible(status)
  }
  const handleConfirm = () => {
    handleModalStatus(false)
    bindchange && bindchange({
      detail: {
        value: formatStr(timevalue)
      }
    })
  }

  const handleCancel = () => {
    handleModalStatus(false)
    bindcancel && bindcancel()
  }

  const handleChildClick = () => {
    handleModalStatus(true)
  }

  const handlePickChange = (date: number[]): void => {
    // [9, 13]
    setTimeValue(date)
    const strDate = formatStr(date)
    bindchange && bindchange({
      detail: {
        value: strDate
      }
    })
  }


  const onElementLayout = () => {
    viewRef.current?.measure((x: number, y: number, width: number, height: number, offsetLeft: number, offsetTop: number) => {
      layoutRef.current = { x, y, width, height, offsetLeft, offsetTop }
      props.getInnerLayout && props.getInnerLayout(layoutRef)
    })
  }

  const onModalLayout = () => {
    modalRef.current?.measure((x: number, y: number, width: number, height: number, offsetLeft: number, offsetTop: number) => {
      modalLayoutRef.current = { x, y, width, height, offsetLeft, offsetTop }
      setOffsetTop(offsetTop)
    })
  }


  const renderModalChildren = () => {
    const pickerProps = {
      data,
      value: timevalue,
      defaultValue: timevalue,
      cols: 2,
      onChange: handlePickChange
    }
    return (
      <View style={styles.centeredView} ref={modalRef} onLayout={onModalLayout}>
        <View style={styles.btnLine}>
          <View style={styles.cancel}>
            <TouchableWithoutFeedback onPress={handleCancel}> 
              <Text>取消</Text>
            </TouchableWithoutFeedback>
          </View>
          <View style={styles.ok}>
            <TouchableWithoutFeedback onPress={handleConfirm}> 
              <Text style={styles.oktext}>确定</Text>
            </TouchableWithoutFeedback>
          </View>
        </View>
        <PickerView {...pickerProps}></PickerView>
      </View>
    )
  }

  const renderChildren = () => {
    const touchProps = {
      onLayout: onElementLayout,
      ref: viewRef
    }  
    return <View>
      <TouchableWithoutFeedback onPress={handleChildClick}>
        <View {...touchProps}>{children}</View>
      </TouchableWithoutFeedback>
    </View>
  }
  const strStyle = visible ? styles['showModal'] : styles['hideModal']
  const mheight = Math.floor(offsetTop)
  return (<>
      <View style={[strStyle, { height: mheight, bottom: 0 }]}>
        <Modal
          animationType="slide"
          transparent={true}
          visible={visible}
          >
          {renderModalChildren()}
        </Modal>
      </View>
    {renderChildren()}
    </>)
})

_TimePicker.displayName = 'mpx-picker-time'

export default _TimePicker

