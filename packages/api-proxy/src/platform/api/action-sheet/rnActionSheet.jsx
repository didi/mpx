import { View, TouchableHighlight, Text, StyleSheet, Button, TouchableWithoutFeedback } from 'react-native'
import { webHandleSuccess, webHandleFail } from '../../../common/js'
import RootSiblings from 'react-native-root-siblings'
function showActionSheet (options) {
  const { alertText, itemList = [], itemColor = '#000000', success, fail, complete } = options
  let rootSiblingsObj
  if (itemList.length === 0 || itemList.length > 6) {
    const result = {
      errMsg: 'showActionSheet:fail parameter error: itemList should not be large than 6'
    }
    if (itemList.length === 0) {
      result.errno = 1001
      result.errMsg = 'showActionSheet:fail parameter error: parameter.itemList should have at least 1 item;'
    }
    webHandleFail(result, fail, complete)
    return
  }
  const styles = StyleSheet.create({
    actionActionMask: {
      left: 0,
      top: 0,
      bottom: 0,
      right: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      position: 'absolute',
      zIndex: 1000
    },
    actionSheetContent: {
      left: 0,
      right: 0,
      position: 'absolute',
      bottom: 0,
      backgroundColor: '#ffffff',
      borderTopLeftRadius: 10,
      borderTopRightRadius: 10
    },
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
  const selectAction = function (index) {
    const result = {
      errMsg: 'showActionSheet:ok',
      tapIndex: index
    }
    webHandleSuccess(result, success, complete)
    rootSiblingsObj.destroy()
    rootSiblingsObj = null
  }
  const cancelAction = function () {
    const result = {
      errMsg: 'showActionSheet:fail cancel'
    }
    webHandleFail(result, fail, complete)
    rootSiblingsObj.destroy()
    rootSiblingsObj = null
  }
  let alertTextList = []
  if (alertText) {
    alertTextList = [alertText]
  }
  const ActionSheetView = <TouchableHighlight underlayColor="rgba(0,0,0,0.6)" onPress={cancelAction} style={styles.actionActionMask}>
    <View
      style={styles.actionSheetContent}>
      { alertTextList.map((item, index) => <View style={ styles.itemStyle }><Text style={[styles.itemTextStyle, { color: '#666666' }]}>{item}</Text></View>) }
      { itemList.map((item, index) => <TouchableHighlight key={index} underlayColor="#ececec" onPress={() => selectAction(index)} style={ [styles.itemStyle, itemList.length -1 === index ? {
        borderBottomWidth: 6,
        borderBottomStyle: 'solid',
        borderBottomColor: '#f7f7f7'
      } : {}] }><Text style={[styles.itemTextStyle, { color: itemColor }]}>{item}</Text></TouchableHighlight>) }
      <View style={styles.buttonStyle}><Button color={'#000000'} title={'取消'} onPress={cancelAction}></Button></View>
    </View>
  </TouchableHighlight>
  rootSiblingsObj = new RootSiblings(ActionSheetView)
}

export {
  showActionSheet
}
