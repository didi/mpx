import { View, Text, StyleSheet } from 'react-native'
import { successHandle, failHandle } from '../../../common/js'
import { createPopupManager } from '@mpxjs/webpack-plugin/lib/runtime/components/react/dist/mpx-popup'

const styles = StyleSheet.create({
  itemStyle: {
    paddingTop: 15,
    paddingBottom: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: 'rgba(0,0,0,0.1)'
  },
  itemTextStyle: {
    fontSize: 18
  },
  buttonStyle: {
    fontSize: 18,
    paddingTop: 10,
    paddingBottom: 10
  }
})

const { open, remove } = createPopupManager()

function showActionSheet (options = {}) {
  const { alertText, itemList = [], itemColor = '#000000', success, fail, complete } = options

  function ActionSheet () {
    const selectAction = function (index, e) {
      e.stopPropagation()
      const result = {
        errMsg: 'showActionSheet:ok',
        tapIndex: index
      }
      successHandle(result, success, complete)
      remove()
    }

    const cancelAction = function (e) {
      e.stopPropagation()
      const result = {
        errMsg: 'showActionSheet:fail cancel'
      }
      failHandle(result, fail, complete)
      remove()
    }

    return (
      <>
        { alertText ? <View style={ styles.itemStyle }><Text style={[styles.itemTextStyle, { color: '#666666' }]}>{alertText}</Text></View> : null }
        { itemList.map((item, index) => <View key={index} onTouchEnd={(e) => selectAction(index, e)} style={ [styles.itemStyle, itemList.length - 1 === index
          ? {
              borderBottomWidth: 6,
              borderBottomStyle: 'solid',
              borderBottomColor: '#f7f7f7'
            }
          : {}] }><Text style={[styles.itemTextStyle, { color: itemColor }]}>{item}</Text></View>) }
        <View style={styles.buttonStyle} onTouchEnd={cancelAction}><Text style={{ color: '#000000', width: '100%', textAlign: 'center' }}>取消</Text></View>
      </>
    )
  }

  open(<ActionSheet />)
}

export {
  showActionSheet
}
